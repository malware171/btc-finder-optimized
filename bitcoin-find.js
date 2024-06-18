import CoinKey from 'coinkey';
import walletsArray from './wallets.js';
import chalk from 'chalk';
import fs from 'fs';

const walletsSet = new Set(walletsArray);

async function encontrarBitcoins(min, startKey, max, shouldStop) {
    const startTime = Date.now();
    const zeroes = '0'.repeat(64);
    const filePath = 'Ultima_chave.txt';
    let key = startKey;
    let keysChecked = 0;

    console.log('Buscando Bitcoins...');

    const updateStatus = (key, elapsedTime) => {
        console.clear();
        console.log('Resumo:');
        console.log('Velocidade:', (Number(key - min) / elapsedTime).toLocaleString('pt-BR'), 'chaves por segundo');
        console.log('Chaves buscadas:', (key - min).toLocaleString('pt-BR'));
        console.log('Ultima chave tentada:', key.toString(16).padStart(64, '0'));
        fs.writeFileSync(filePath, `Ultima chave tentada: ${key.toString(16).padStart(64, '0')}`, 'utf8');
    };

    const checkKey = (key) => {
        let pkey = key.toString(16).padStart(64, '0');
        const publicKey = generatePublic(pkey);
        if (walletsSet.has(publicKey)) {
            const elapsedTime = (Date.now() - startTime) / 1000;
            console.log('Velocidade:', (Number(key - min) / elapsedTime).toLocaleString('pt-BR'), 'chaves por segundo');
            console.log('Tempo:', elapsedTime, 'segundos');
            console.log('Private key:', chalk.green(pkey));
            console.log('WIF:', chalk.green(generateWIF(pkey)));
            fs.appendFileSync('keys.txt', `Private key: ${pkey}, WIF: ${generateWIF(pkey)}\n`);
            console.log('Chave escrita no arquivo com sucesso.');
            throw 'ACHEI!!!! 🎉🎉🎉🎉🎉';
        }
    };

    try {
        while (!shouldStop() && key < max) {
            key++;
            keysChecked++;
            checkKey(key);
            if (keysChecked % 100000 === 0) { // Atualiza a cada 100.000 chaves
                const elapsedTime = (Date.now() - startTime) / 1000;
                updateStatus(key, elapsedTime);
            }
            await new Promise(resolve => setImmediate(resolve));
        }
    } catch (err) {
        if (err !== 'ACHEI!!!! 🎉🎉🎉🎉🎉') {
            console.error('Erro inesperado:', err);
        }
    }

    console.log('Processo interrompido ou concluído.');
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

export default encontrarBitcoins;
