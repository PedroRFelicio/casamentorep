# Site de Casamento (Esqueleto Inicial)

Projeto inicial em Next.js com:

- paginas principais de casamento
- formulario de RSVP salvo no PostgreSQL (AWS RDS)
- formulario de recados salvo no PostgreSQL (com aprovacao futura)
- Prisma como ORM

## 1) Configurar ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edite o `DATABASE_URL` no `.env`.

Exemplo com SSL obrigatorio:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@sistemagerenciamento-db.cv2y6cq0eqc3.sa-east-1.rds.amazonaws.com:5432/projetocmt?schema=public&sslmode=require"
```

## 2) Instalar dependencias

```bash
npm install
```

## 3) Gerar cliente Prisma e criar tabelas

```bash
npm run prisma:generate
npm run prisma:push
```

## 4) Rodar local

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Rotas principais

- `/` Home
- `/rsvp` Confirmacao de presenca
- `/recados` Envio de recados
- `/noivos`
- `/cerimonia`
- `/onde-ficar`
- `/presentes`

## Proximos passos recomendados

1. Criar area admin protegida para listar e aprovar recados.
2. Criar dashboard de confirmacoes com exportacao CSV.
3. Integrar lista de presentes com checkout (Pix/cartao).
4. Publicar na AWS e configurar dominio + HTTPS.
