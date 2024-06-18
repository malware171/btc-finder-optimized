import { parentPort, workerData } from 'worker_threads';
import CoinKey from 'coinkey';
import walletsArray from './wallets.js';
import fs from 'fs';

const walletsSet = new Set(walletsArray);
let shouldStop = false;
let startTime = Date.now();

parentPort.on('message', (message) => {
    if (message === 'stop') {
        shouldStop = true;
    }
});

async function encontrarBitcoins(min, max) {
    const zeroes = '0'.repeat(64);
    let key = min;
    let keysChecked = 0;

    console.log(`Worker iniciado com intervalo: ${min.toString(16)} - ${max.toString(16)}`);

    while (key <= max && !shouldStop) {
        key++;
        keysChecked++;
        let pkey = key.toString(16).padStart(64, '0');
        const publicKey = generatePublic(pkey);

        if (walletsSet.has(publicKey)) {
            const filePath = 'keys.txt';
            const lineToAppend = `Private key: ${pkey}, WIF: ${generateWIF(pkey)}\n`;

            try {
                // Verifica se o arquivo existe antes de tentar escrever
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, ''); // Cria o arquivo se não existir
                }

                // Escreve no arquivo de forma assíncrona
                fs.appendFile(filePath, lineToAppend, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`Chave encontrada! Private key: ${pkey}, WIF: ${generateWIF(pkey)}`);
                    parentPort.postMessage('found');
                    throw 'ACHEI!!!! 🎉🎉🎉🎉🎉'; // Lança uma exceção para parar o worker
                });
            } catch (err) {
                console.error('Erro ao escrever chave em arquivo:', err);
            }
        }

        if (keysChecked % 1000 === 0) {
            console.log(`Chaves verificadas: ${keysChecked}, última chave: ${pkey}`);
            fs.writeFileSync('Ultima_chave.txt', `Ultima chave tentada: ${pkey}`, 'utf8');
        }

        await new Promise(resolve => setImmediate(resolve));
    }

    parentPort.postMessage('done');
    console.log('Worker finalizado.');

    // Calcular e exibir o tempo decorrido
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`Tempo total de execução do worker: ${totalTime.toFixed(2)} segundos`);
}

function generatePublic(privateKey) {
    const key = new CoinKey(Buffer.from(privateKey, 'hex'));
    key.compressed = true;
    return key.publicAddress;
}

function generateWIF(privateKey) {
    const key = new CoinKey(Buffer.from(privateKey, 'hex'));
    return key.privateWif;
}

encontrarBitcoins(workerData.min, workerData.max).catch(err => {
    if (err !== 'ACHEI!!!! 🎉🎉🎉🎉🎉') {
        console.error('Erro inesperado:', err);
    }
});


//////////////////////////////////////////////////////////////////////////////////////


import { parentPort, workerData } from 'worker_threads';
import secp256k1 from 'secp256k1';
import { createHash } from 'crypto';
import bs58check from 'bs58check'; // Importe o módulo bs58check aqui
import walletsArray from './wallets.js';
import fs from 'fs';

const walletsSet = new Set(walletsArray);
let shouldStop = false;
let startTime = Date.now();

parentPort.on('message', (message) => {
    if (message === 'stop') {
        shouldStop = true;
    }
});

async function encontrarBitcoins(min, max) {
    let key = min;
    let keysChecked = 0;

    console.log(`Worker iniciado com intervalo: ${min.toString(16)} - ${max.toString(16)}`);

    while (key <= max && !shouldStop) {
        key++;
        keysChecked++;
        let pkey = key.toString(16).padStart(64, '0');
        const publicKey = generatePublic(pkey);

        if (walletsSet.has(publicKey)) {
            const filePath = 'keys.txt';
            const lineToAppend = `Private key: ${pkey}, WIF: ${generateWIF(pkey)}\n`;

            try {
                // Verifica se o arquivo existe antes de tentar escrever
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, ''); // Cria o arquivo se não existir
                }

                // Escreve no arquivo de forma assíncrona
                fs.appendFile(filePath, lineToAppend, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`Chave encontrada! Private key: ${pkey}, WIF: ${generateWIF(pkey)}`);
                    parentPort.postMessage('found');
                    throw 'ACHEI!!!! 🎉🎉🎉🎉🎉'; // Lança uma exceção para parar o worker
                });
            } catch (err) {
                console.error('Erro ao escrever chave em arquivo:', err);
            }
        }

        if (keysChecked % 1000 === 0) {
            console.log(`Chaves verificadas: ${keysChecked}, última chave: ${pkey}`);
            fs.writeFileSync('Ultima_chave.txt', `Ultima chave tentada: ${pkey}`, 'utf8');
        }

        await new Promise(resolve => setImmediate(resolve));
    }

    parentPort.postMessage('done');
    console.log('Worker finalizado.');

    // Calcular e exibir o tempo decorrido
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`Tempo total de execução do worker: ${totalTime.toFixed(2)} segundos`);
}

function generatePublic(privateKey) {
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const publicKey = secp256k1.publicKeyCreate(privateKeyBuffer, true);
    const publicKeyHash = createHash('sha256').update(publicKey).digest();
    const address = createHash('rmd160').update(publicKeyHash).digest();
    return bs58check.encode(Buffer.concat([Buffer.from([0x00]), address]));
}

function generateWIF(privateKey) {
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const extendedKey = Buffer.concat([Buffer.from([0x80]), privateKeyBuffer, Buffer.from([0x01])]);
    return bs58check.encode(extendedKey);
}

encontrarBitcoins(workerData.min, workerData.max).catch(err => {
    if (err !== 'ACHEI!!!! 🎉🎉🎉🎉🎉') {
        console.error('Erro inesperado:', err);
    }
});

