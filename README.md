# Código btc-finder otimizado 

## Instalação

### Passo 1: Clonar o Repositório

```
git clone https://github.com/malware171/btc-finder-optimized.git
cd otimized
```
### Passo 2: Instalar Dependências

```
sudo apt update && sudo apt upgrade 
```

### Passo 3: Configurar Node.js
#### Certifique-se de que a versão do Node.js instalada seja 16 ou superior:
```
node -v
```
#### Instalar NVM
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

```
#### Carregar NVM
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

#### Instalar e Usar Node.js 16
```
nvm install 16
nvm use 16
```

### Passo 4: Instalar Pacotes Adicionais
```
npm install secp256k1
npm install bs58check
```

## Rodar Aplicacao nos Workers em Background 

### Passo 1: Instalar Screen
```
sudo apt install screen
```

### Passo 2: Executar o Projeto
 - Criar uma nova sessão do Screen:
```
screen -S nome-da-sessao
```

### Rodar o projeto 
```
node main.js
```
