import net from 'net';
import fs from 'fs';

// Configurações do servidor
const HOST = '0.0.0.0'; // Todas as interfaces de rede
const PORT = 3000;

// Arquivo para salvar chaves encontradas
const filePath = 'found_keys.txt';

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
            // Exibir velocidade do trabalhador
            const speed = message.substring(6);
            console.log(`Velocidade do trabalhador ${clientId}: ${speed} chaves/s`);
        }
    });

    socket.on('error', (err) => {
        console.error('Erro no cliente:', err);
    });

    socket.on('end', () => {
        console.log(`Cliente ${clientId} desconectado`);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor iniciado em ${HOST}:${PORT}`);
});
