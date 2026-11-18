# muse-drill-rest-api

Small REST API built as an engineering drill: **Node.js + TypeScript + Express + JWT**, with **in-memory storage** (no database).

## Endpoints

| Method | Path           | Auth         | Description                              |
| ------ | -------------- | ------------ | ---------------------------------------- |
| POST   | `/auth/login`  | —            | Log in, returns a JWT                    |
| POST   | `/items`       | Bearer token | Create an item (owner = caller)          |
| GET    | `/items`       | —            | List all items                           |
| GET    | `/items/:id`   | —            | Get one item (404 if missing)            |
| DELETE | `/items/:id`   | Bearer token | Delete an item — **owner only** (403 otherwise) |
| GET    | `/health`      | —            | Health check                             |

## Seeded users (demo only)

| username | password    | id      |
| -------- | ----------- | ------- |
| alice    | password123 | u-alice |
| bob      | password123 | u-bob   |

## Run

```sh
npm install
npm run build
npm start
# server listens on http://localhost:3000
```

Development (auto-reload via tsx):

```sh
npm run dev
```

Environment variables:

- `PORT` — port to listen on (default `3000`)
- `JWT_SECRET` — secret used to sign tokens (default `dev-secret-change-me`, change it in production)

## Test

```sh
npm test        # vitest + supertest, 7 tests
npm run typecheck
npm run lint
```

## Example

```sh
# log in
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"password123"}'
# => {"token":"<JWT>"}

# create an item
curl -s -X POST http://localhost:3000/items \
  -H "Authorization: Bearer <JWT>" \
  -H 'Content-Type: application/json' \
  -d '{"title":"First item","body":"hello"}'
# => {"id":"item-1","title":"First item","body":"hello","ownerId":"u-alice","createdAt":"..."}

# delete it (only alice can)
curl -s -X DELETE http://localhost:3000/items/item-1 \
  -H "Authorization: Bearer <JWT>"
# => 204 No Content
```

## Notes

- Storage is in-memory (`src/store.ts`): items disappear when the process restarts.
- Auth is a Bearer JWT (`src/auth.ts`). Tokens expire after 1 hour.
- Deleting an item owned by another user returns `403`; deleting a missing item returns `404`.
