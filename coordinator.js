import net from 'net';
import fs from 'fs';

// Configurações do servidor
const HOST = '0.0.0.0'; // Todas as interfaces de rede
const PORT = 3000;

// Arquivo para salvar chaves encontradas
const filePath = 'keys.txt';

// Objeto para armazenar as métricas dos workers
const workerMetrics = {};

// Função para exibir métricas a cada 60 segundos
setInterval(() => {
    console.log('--- Métricas dos Workers ---');
    for (const [clientId, metrics] of Object.entries(workerMetrics)) {
        console.log(`Worker ${clientId}: ${metrics.speed} chaves/s`);
    }
    console.log('-----------------------------');
}, 60000);

const server = net.createServer((socket) => {
    console.log('Cliente conectado!');

    // Gerar um ID único para cada cliente
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`;

    socket.on('data', (data) => {
        const message = data.toString();

        if (message.startsWith('result:')) {
            // Processar resultado do trabalhador
            const result = message.substring(7);
            console.log(`Resultado recebido do trabalhador ${clientId}: ${result}`);
            fs.appendFile(filePath, result + '\n', (err) => {
                if (err) {
                    console.error('Erro ao salvar a chave encontrada:', err);
                }
            });
        } else if (message.startsWith('speed:')) {
            // Atualizar velocidade do trabalhador
            const speed = message.substring(6);
            workerMetrics[clientId] = { speed };
        }
    });

    socket.on('error', (err) => {
        console.error('Erro no cliente:', err);
    });

    socket.on('end', () => {
        console.log(`Cliente ${clientId} desconectado`);
        delete workerMetrics[clientId]; // Remover métricas do worker desconectado
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor iniciado em ${HOST}:${PORT}`);
});
