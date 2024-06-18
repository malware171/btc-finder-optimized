import net from 'net';

// Configurações do servidor
const HOST = '0.0.0.0'; // Todas as interfaces de rede
const PORT = 3000;

const server = net.createServer((socket) => {
    console.log('Cliente conectado!');

    socket.on('data', (data) => {
        const message = data.toString();

        if (message === 'start') {
            console.log('Iniciando tarefa distribuída...');
            // Envie a tarefa para este cliente
            socket.write('Task assigned'); // Mensagem inicial, pode ser ajustada conforme necessário
        } else if (message.startsWith('result:')) {
            // Processar resultado do trabalhador
            console.log('Resultado recebido do trabalhador:', message.substring(7));
        }
    });

    socket.on('error', (err) => {
        console.error('Erro no cliente:', err);
    });

    socket.on('end', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor iniciado em ${HOST}:${PORT}`);
});
