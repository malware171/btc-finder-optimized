import { Worker } from 'worker_threads';
import ranges from './ranges.js';
import readline from 'readline';
import chalk from 'chalk';

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

    // Dividir o intervalo de chaves para os trabalhadores
    const numWorkers = 2;  // Ajustar com base no número de núcleos da CPU
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




/////////////////////////////////////////////////  ATUALIZACAO OTIMIZACAO 2 TESTE //////////////////////////////////

import { Worker } from 'worker_threads';
import ranges from './ranges.js';
import readline from 'readline';
import chalk from 'chalk';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let shouldStop = false;
let workerPool = [];  // Definindo workerPool no escopo global

console.clear();
console.log("Escolha uma carteira puzzle(1 - 160): ");

rl.question(`Escolha uma carteira puzzle(${chalk.cyan(1)} - ${chalk.cyan(160)}): `, (answer) => {
    const index = parseInt(answer) - 1;
    if (index < 0 || index >= ranges.length) {
        console.log(chalk.bgRed('Erro: voce precisa escolher um numero entre 1 e 160'));
        rl.close();
        return;
    }

    let min = BigInt(ranges[index].min);
    let max = BigInt(ranges[index].max);

    console.log('Carteira escolhida: ', chalk.cyan(answer), ' Min: ', chalk.yellow(min), ' Max: ', chalk.yellow(max));
    console.log('Numero possivel de chaves:', chalk.yellow((max - min).toLocaleString('pt-BR')));

    let status = ranges[index].status === 1 ? chalk.red('Encontrada') : chalk.green('Nao Encontrada');
    console.log('Status: ', status);

    rl.question(`Escolha uma opcao (${chalk.cyan(1)} - Comecar do inicio, ${chalk.cyan(2)} - Escolher uma porcentagem, ${chalk.cyan(3)} - Escolher minimo): `, (answer2) => {
        if (answer2 == '2') {
            rl.question('Escolha um numero entre 0 e 1: ', (answer3) => {
                const percentage = parseFloat(answer3);
                if (percentage < 0 || percentage > 1) {
                    console.log(chalk.bgRed('Erro: voce precisa escolher um numero entre 0 e 1'));
                    rl.close();
                    return;
                }

                const range = max - min;
                min += range * BigInt(Math.floor(percentage * 1e18)) / BigInt(1e18);
                console.log('Comecando em: ', chalk.yellow('0x' + min.toString(16)));
                startWorkers(min, max);
                rl.close();
            });
        } else if (answer2 == '3') {
            rl.question('Entre o minimo: ', (answer3) => {
                min = BigInt(answer3);
                startWorkers(min, max);
                rl.close();
            });
        } else {
            startWorkers(min, max);
            rl.close();
        }
    });
});

rl.on('SIGINT', () => {
    process.exit();
});

process.on('SIGINT', () => {
    process.exit();
});

function startWorkers(min, max) {
    const numWorkers = 2; // Ajuste baseado na sua CPU
    workerPool = [];  // Inicializar a pool de trabalhadores
    const rangeSize = (max - min) / BigInt(numWorkers);
    const startTime = Date.now();

    for (let i = 0; i < numWorkers; i++) {
        const workerMin = min + rangeSize * BigInt(i);
        const workerMax = i === numWorkers - 1 ? max : workerMin + rangeSize;
        const worker = createWorker(workerMin, workerMax);
        workerPool.push(worker); // Armazenar a instância do Worker
    }

    Promise.all(workerPool.map(w => w.promise)).then(() => {
        const endTime = Date.now();
        console.log(`Processo concluído em ${(endTime - startTime) / 1000} segundos.`);
    }).catch(err => {
        console.error('Erro inesperado:', err);
    });
}

function createWorker(min, max) {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    const worker = new Worker('./worker.js', {
        workerData: { min: min.toString(), max: max.toString() }
    });

    worker.on('message', (message) => {
        if (message === 'found') {
            shouldStop = true;
            workerPool.forEach(w => w.worker.terminate()); // Interromper todos os trabalhadores
            resolve();
        }
    });

    worker.on('error', (error) => {
        reject(error);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
        } else {
            resolve();
        }
    });

    return { worker, promise }; // Retornar a instância do Worker e a promessa associada
}
