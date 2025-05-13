# Stage 1: build da aplicação
FROM node:18-alpine AS builder

WORKDIR /app
# copia package.json e package-lock.json (se existir)
COPY package*.json ./
# instala dependências
RUN npm ci

# copia todo o código-fonte e gera o build estático
COPY . .
RUN npm run build

# Stage 2: serve com Nginx
FROM nginx:stable-alpine

# remove configuração default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# copia configuração customizada
COPY nginx.conf /etc/nginx/conf.d/

# copia build gerado na etapa anterior para o diretório padrão do Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# expõe a porta em que o Nginx vai rodar
EXPOSE 80

# inicia o Nginx em foreground
CMD ["nginx", "-g", "daemon off;"]
