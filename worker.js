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
                fs.appendFileSync(filePath, lineToAppend);
                parentPort.postMessage('found');
                console.log(`Chave encontrada! Private key: ${pkey}, WIF: ${generateWIF(pkey)}`);
            } catch (err) {
                console.error('Erro ao escrever chave em arquivo:', err);
            }

            throw 'ACHEI!!!! 🎉🎉🎉🎉🎉';
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


/'//////////////////////// ATUALIZACAO 02 /////////////


import { parentPort, workerData } from 'worker_threads';
import CoinKey from 'coinkey';
import walletsArray from './wallets.js';
import chalk from 'chalk';

const walletsSet = new Set(walletsArray);
const zeroes = Array.from({ length: 65 }, (_, i) => '0'.repeat(64 - i));

let { min, max } = workerData;
min = BigInt(min);
max = BigInt(max);

const startTime = Date.now();

async function encontrarBitcoins(min, max) {
    console.log('Worker started: ', min.toString(16), max.toString(16));

    let key = min;

    while (key <= max && !shouldStop) {
        key++;
        let pkey = key.toString(16);
        pkey = `${zeroes[pkey.length]}${pkey}`;
        let publicKey = generatePublic(pkey);
        
        if (walletsSet.has(publicKey)) {
            const endTime = Date.now();
            console.log('Private key:', chalk.green(pkey));
            console.log('WIF:', chalk.green(generateWIF(pkey)));
            console.log(`Worker found key in ${(endTime - startTime) / 1000} segundos.`);
            parentPort.postMessage('found');
            return;
        }

        await new Promise(resolve => setImmediate(resolve));
    }

    const endTime = Date.now();
    console.log(`Worker finished: ${min.toString(16)} - ${max.toString(16)} in ${(endTime - startTime) / 1000} segundos.`);
    parentPort.close();
}

function generatePublic(privateKey) {
    let _key = new CoinKey(Buffer.from(privateKey, 'hex'));
    _key.compressed = true;
    return _key.publicAddress;
}

function generateWIF(privateKey) {
    let _key = new CoinKey(Buffer.from(privateKey, 'hex'));
    return _key.privateWif;
}

let shouldStop = false;
parentPort.on('message', (message) => {
    if (message === 'stop') {
        shouldStop = true;
    }
});

encontrarBitcoins(min, max);
