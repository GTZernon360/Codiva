# Codiva

Plataforma de aprendizado de programação. O app usa React, Vite e CSS no frontend, Express na API, PostgreSQL para dados e Clerk para autenticação.

## Requisitos

- Node.js `20.19+` ou `22.12+`
- PostgreSQL
- Uma instância Clerk para autenticação

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e configure as variáveis:

   - `DATABASE_URL`: conexão com um banco PostgreSQL de desenvolvimento.
   - `CLERK_SECRET_KEY`: chave privada do Clerk; mantenha-a somente no servidor.
   - `CLERK_PUBLISHABLE_KEY`: chave pública do Clerk usada pelo servidor.
   - `VITE_CLERK_PUBLISHABLE_KEY`: a mesma chave pública, disponibilizada ao frontend.
   - `VITE_CLERK_PROXY_URL`: opcional; configure o endereço do proxy Clerk quando necessário no ambiente publicado.

   Não envie o arquivo `.env` para repositórios ou terceiros.

3. Aplique as migrações ao banco de desenvolvimento:

   ```bash
   npm run migrate
   ```

   Confira `DATABASE_URL` antes de executar. O comando altera o banco indicado por essa variável.

4. Inicie o modo de desenvolvimento:

   ```bash
   npm run dev
   ```

## Comandos

```bash
npm test          # testes das respostas dos exercícios
npm run build     # gera a aplicação em dist/
npm start         # inicia o servidor em modo de produção; requer npm run build
```

## Estrutura

- `client/index.html`, `client/src/` — entrada, componentes React/JSX, cliente da API e estilos CSS.
- `server/` — servidor Express, autenticação, rotas, avaliação de exercícios e regras de aprendizagem.
- `db/migrations/` — estrutura e conteúdo inicial do PostgreSQL.
- `shared/` — contratos compartilhados entre frontend e API.

O HTML da interface é montado pelos componentes React/JSX; por isso não existe um `script.js` independente para a aplicação. O `npm run build` produz os arquivos finais do navegador em `dist/`.

O pacote de código-fonte não inclui dependências instaladas, a pasta `dist/`, dados do banco nem credenciais.
