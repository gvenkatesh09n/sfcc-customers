# SFCC Customers service (NestJS)

Receives customer-registration pushes from Salesforce Commerce Cloud and stores them in SQLite.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| POST | `/sfcc/customers` | Needs `x-api-key`. Body = SFCC event envelope (`dropshipper.account.created`). Upserts by `customer__customer-no` (duplicate-safe). Other event types are ignored. |
| POST | `/pubsub/push` | Needs `x-api-key` (demo; real push uses OIDC). Body = Pub/Sub push body, envelope base64 in `message.data`. |
| GET | `/customers` | List stored customers |
| GET | `/customers/:id` | One customer, 404 if missing |

## Run locally
```
npm install
cp .env.example .env
npm run start:dev
```
Use `requests.http` (VS Code REST Client) to simulate SFCC.

## Tests
```
npm test          # unit
npm run test:e2e  # end to end (in-memory SQLite)
```

## Deploy (Render free web service)
1. Push this folder to a GitHub repo (`.env` and `*.sqlite` are git-ignored).
2. Render -> New -> Web Service -> connect repo -> Runtime: **Docker** -> Instance: **Free**.
3. Add env var `SFCC_API_KEY` (strong secret). Render sets `PORT` itself.
4. Deploy; give SFCC `https://<service>.onrender.com/sfcc/customers` + the key.

Notes: the free instance sleeps after ~15 min idle (first request is slow) and the
disk is ephemeral, so SQLite data is lost on restart. For persistence use a hosted
Postgres and switch the TypeORM driver.

Alternative: Google Cloud Run (`gcloud run deploy --source .`).

## Design choices
- `customerNo` is the natural key; upsert makes retried/duplicate deliveries safe.
- Shared-secret guard for now; Pub/Sub push (OIDC) is a month 2 topic.
- `synchronize: true` is demo-only; use migrations in real environments.
