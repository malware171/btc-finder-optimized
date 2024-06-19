import { Worker } from 'worker_threads';
import ranges from './ranges.js';
import readline from 'readline';
import chalk from 'chalk';
import os from 'os';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.clear();

const displayHeader = () => {
    console.log(chalk.rgb(250, 128, 114)(
        `╔════════════════════════════════════════════════════════╗
║${chalk.cyan("   ____ _____ ____   _____ ___ _   _ ____  _____ ____   ")}║
║${chalk.cyan("  | __ )_   _/ ___| |  ___|_ _| \\ | |  _ \\| ____|  _ \\  ")}║
║${chalk.cyan("  |  _ \\ | || |     | |_   | ||  \\| | | | |  _| | |_) | ")}║
║${chalk.cyan("  | |_) || || |___  |  _|  | || |\\  | |_| | |___|  _ <  ")}║
║${chalk.cyan("  |____/ |_| \\____| |_|   |___|_| \\_|____/|_____|_| \\_\\ ")}║
║${chalk.cyan("                                                        ")}║
╚══════════════════════${chalk.green("Investidor Internacional - v0.5")}════════╝`
    ));
};

const promptUser = async (question) => {
    return new Promise((resolve) => rl.question(question, resolve));
};

const validateChoice = (choice, min, max) => {
    const numChoice = parseInt(choice);
    if (isNaN(numChoice) || numChoice < min || numChoice > max) {
        console.log(chalk.bgRed(`Erro: voce precisa escolher um numero entre ${min} e ${max}`));
        return false;
    }
    return true;
};

const main = async () => {
    displayHeader();
    
    let answer;
    do {
        answer = await promptUser(`Escolha uma carteira puzzle (${chalk.cyan(1)} - ${chalk.cyan(160)}): `);
    } while (!validateChoice(answer, 1, 160));
    
    const choice = parseInt(answer);
    const range = ranges[choice - 1];
    let { min, max, status } = range;
    min = BigInt(min);
    max = BigInt(max);

    console.log(`Carteira escolhida: ${chalk.cyan(choice)} Min: ${chalk.yellow(min)} Max: ${chalk.yellow(max)}`);
    console.log(`Numero possivel de chaves: ${chalk.yellow((max - min).toLocaleString('pt-BR'))}`);
    console.log(`Status: ${status == 1 ? chalk.red('Encontrada') : chalk.green('Nao Encontrada')}`);

    const option = await promptUser(`Escolha uma opcao (${chalk.cyan(1)} - Comecar do inicio, ${chalk.cyan(2)} - Escolher uma porcentagem, ${chalk.cyan(3)} - Escolher minimo): `);

    switch (option) {
        case '2':
            const percentage = parseFloat(await promptUser('Escolha um numero entre 0 e 1: '));
            if (percentage >= 0 && percentage <= 1) {
                const rangeLength = max - min;
                min += BigInt(Math.floor(Number(rangeLength) * percentage));
                console.log('Comecando em: ', chalk.yellow('0x' + min.toString(16)));
            } else {
                console.log(chalk.bgRed('Erro: voce precisa escolher um numero entre 0 e 1'));
                rl.close();
                return;
            }
            break;
        case '3':
            min = BigInt(await promptUser('Entre o minimo: '));
            break;
        default:
            break;
    }

    const totalCPUs = os.cpus().length;
    const numWorkers = totalCPUs > 1 ? Math.ceil(totalCPUs / 2) : 1; // Usar a metade dos núcleos da CPU ou 1 se houver apenas 1 núcleo
    const rangeSize = (max - min) / BigInt(numWorkers);
    let workers = [];
    let promises = [];
    for (let i = 0; i < numWorkers; i++) {
        const workerMin = min + BigInt(i) * rangeSize;
        const workerMax = (i === numWorkers - 1) ? max : workerMin + rangeSize - BigInt(1);
        promises.push(new Promise((resolve, reject) => {
            const worker = new Worker('./worker.js', {
                workerData: { min: workerMin, max: workerMax }
            });
            workers.push(worker);
            console.log(`Worker ${i} iniciado com intervalo: ${workerMin.toString(16)} - ${workerMax.toString(16)}`);
            worker.on('message', (msg) => {
                if (msg === 'found') {
                    workers.forEach(w => w.postMessage('stop'));
                    console.log('Chave encontrada! Parando todos os workers.');
                    resolve();
                } else if (msg === 'done') {
                    console.log(`Worker ${i} finalizado.`);
                    resolve();
                }
            });
            worker.on('error', reject);
            worker.on('exit', resolve);
        }));
    }

    try {
        await Promise.all(promises);
    } catch (e) {
        if (e !== 'ACHEI!!!! 🎉🎉🎉🎉🎉') {
            console.error('Erro inesperado:', e);
        }
    }

    rl.close();
};

main();

rl.on('SIGINT', () => {
    workers.forEach(w => w.postMessage('stop'));
    rl.close();
    process.exit();
});

process.on('SIGINT', () => {
    workers.forEach(w => w.postMessage('stop'));
    rl.close();
    process.exit();
});
