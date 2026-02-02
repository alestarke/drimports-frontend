# Use uma imagem leve do Node
FROM node:22-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Atualiza os pacotes do sistema para corrigir vulnerabilidades conhecidas
RUN apk update && apk upgrade

# Copia os arquivos de dependências
COPY package.json ./

# Instala as dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host"]