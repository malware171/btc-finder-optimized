import { parentPort, workerData } from 'worker_threads';
import secp256k1 from 'secp256k1';
import { createHash } from 'crypto';
import bs58check from 'bs58check';
import walletsArray from './wallets.js';
import fs from 'fs';
import net from 'net'; // Módulo para comunicação via TCP/IP

const SERVER_HOST = '192.168.1.100'; // IP do servidor coordinator.js
const SERVER_PORT = 3000; // Porta do servidor

const walletsSet = new Set(walletsArray);
let shouldStop = false;
let startTime = Date.now();
let buffer = Buffer.alloc(0); // Buffer para acumular dados em memória
const maxBufferLength = 1024 * 1024; // Tamanho máximo do buffer antes de escrever no disco
const filePath = 'keys.txt';

parentPort.on('message', (message) => {
    if (message === 'stop') {
        shouldStop = true;
    }
});

// Função para se conectar ao servidor
async function connectToServer() {
    return new Promise((resolve, reject) => {
        const client = net.createConnection({ host: SERVER_HOST, port: SERVER_PORT }, () => {
            console.log('Conectado ao servidor!');
            resolve(client);
        });

        client.on('error', (err) => {
            console.error('Erro na conexão com o servidor:', err);
            reject(err);
        });
    });
}

// Função principal que realiza a busca de bitcoins
async function encontrarBitcoins(min, max) {
    let key = min;
    let keysChecked = 0;

    console.log(`Worker iniciado com intervalo: ${min.toString(16)} - ${max.toString(16)}`);

    // Conecta ao servidor
    let client;
    try {
        client = await connectToServer();
    } catch (err) {
        console.error('Não foi possível conectar ao servidor:', err);
        return;
    }

    while (key <= max && !shouldStop) {
        key++;
        keysChecked++;
        let pkey = key.toString(16).padStart(64, '0');
        const publicKey = generatePublic(pkey);

        if (walletsSet.has(publicKey)) {
            const lineToAppend = `Private key: ${pkey}, WIF: ${generateWIF(pkey)}\n`;
            buffer = Buffer.concat([buffer, Buffer.from(lineToAppend)]);

            if (buffer.length >= maxBufferLength) {
                await writeFileAsync(); // Escreve o buffer no disco quando atinge o tamanho máximo
            }

            console.log(`Chave encontrada! Private key: ${pkey}, WIF: ${generateWIF(pkey)}`);
            parentPort.postMessage('found');
            throw 'ACHEI!!!! 🎉🎉🎉🎉🎉'; // Lança uma exceção para parar o worker
        }

        if (keysChecked % 1000 === 0) {
            console.log(`Chaves verificadas: ${keysChecked}, última chave: ${pkey}`);
            await writeFileAsync('Ultima_chave.txt', `Ultima chave tentada: ${pkey}`);
        }

        await new Promise(resolve => setImmediate(resolve));
    }

    await writeFileAsync(); // Escreve qualquer conteúdo restante no buffer no disco

    parentPort.postMessage('done');
    console.log('Worker finalizado.');

    // Fecha a conexão com o servidor
    client.end();

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

async function writeFileAsync(fileName = filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, data || buffer, { flag: 'a' }, (err) => {
            if (err) {
                reject(err);
            } else {
                buffer = Buffer.alloc(0); // Limpa o buffer após escrever no disco
                resolve();
            }
        });
    });
}

encontrarBitcoins(workerData.min, workerData.max).catch(err => {
    if (err !== 'ACHEI!!!! 🎉🎉🎉🎉🎉') {
        console.error('Erro inesperado:', err);
    }
});
