# money-track-front

Frontend do Money Track: React + TypeScript + Vite + MUI. Mobile-first, pensado
para uso no celular (iPhone incluso). Vira PWA instalavel na Fase 4.

O backend e o `docker-compose.yml` (que sobe tudo junto) ficam no repositorio
irmao `../money-track-back`. Este README cobre rodar **o frontend isoladamente**.

## Stack

- React 18 + TypeScript + Vite
- MUI (Material UI) — componentes prontos, mobile-first
- React Router, TanStack Query (cache/estado de servidor)
- React Hook Form + Zod (validacao no cliente)
- Recharts (graficos), Axios, Day.js
- Mascara monetaria com react-number-format

## Estrutura

```
money-track-front/
├─ Dockerfile            # build Vite -> nginx
├─ nginx.conf            # SPA fallback
├─ .env.example
├─ index.html
├─ vite.config.ts
└─ src/
   ├─ main.tsx           # providers (Query, MUI, Router, Auth)
   ├─ App.tsx            # rotas
   ├─ theme.ts
   ├─ api/               # client axios + endpoints + tipos
   ├─ auth/              # contexto JWT, login, guarda de rota
   ├─ components/        # layout, FAB, dialogs, campos (dinheiro, mes)
   ├─ lib/               # formatacao (moeda, mes)
   └─ pages/             # Dashboard, Lancamentos, Categorias
```

## Telas

- **Login** — usuario/senha (JWT salvo no localStorage).
- **Painel** — seletor de mes, cards (receitas, despesas, saldo, acumulado),
  grafico de evolucao do saldo/acumulado e pizza de despesas por categoria.
  Meses futuros mostram projecao (fixos + parcelas).
- **Lancamentos** — filtros (mes, tipo, categoria, recorrencia, texto), lista com
  editar/excluir. Recorrentes perguntam o alcance (somente este / este e seguintes / todos).
- **Categorias** — CRUD, arquivar, mostrar arquivadas.
- **Cadastro rapido** — botao flutuante "+" em qualquer tela.

## Rodar isolado (dev)

Pre-requisitos: Node 20+ e um backend rodando (veja `../money-track-back`).

```bash
cp .env.example .env     # ajuste VITE_API_BASE_URL se o backend nao estiver em :8080
npm install
npm run dev              # http://localhost:5173
```

## Build de producao

```bash
npm run build            # gera dist/
npm run preview          # serve o dist localmente
```

## Variaveis de ambiente

| Variavel            | Descricao                 | Default                 |
|---------------------|---------------------------|-------------------------|
| `VITE_API_BASE_URL` | URL base da API (backend) | http://localhost:8080   |

> Variaveis `VITE_*` sao embutidas **no momento do build**. No Docker, o valor vem
> do build-arg `VITE_API_BASE_URL` (definido no `docker-compose.yml`).

## Rodar via Docker (parte do ambiente completo)

Preferencialmente use o `docker compose up --build` do repositorio do backend, que
sobe banco + backend + frontend juntos. Para buildar so a imagem do front:

```bash
docker build -t money-track-front --build-arg VITE_API_BASE_URL=http://localhost:8080 .
docker run -p 5173:80 money-track-front
```
