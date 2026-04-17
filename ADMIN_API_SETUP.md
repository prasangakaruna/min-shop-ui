# Admin panel — API & Keycloak setup

The admin panel is wired to **Mint e-commerce-api**. It uses **Keycloak** for login and sends the JWT on every API request. Store context is sent via **X-Store-Id**.

## 1. Environment

Copy `.env.local.example` to `.env.local` and set:

- **NEXT_PUBLIC_API_URL** — Base URL of the Mint API (e.g. `http://localhost:8000/api`).
- **AUTH_SECRET** — Random secret (e.g. `openssl rand -base64 32`).
- **KEYCLOAK_CLIENT_ID** — Keycloak client used by the frontend (e.g. `mint-ecommerce`).
- **KEYCLOAK_CLIENT_SECRET** — Client secret if the client is confidential.
- **KEYCLOAK_ISSUER** — Keycloak realm issuer URL. If Keycloak runs at `http://localhost:9091/`, use `http://localhost:9091/realms/mint` (replace `mint` with your realm name).

See **Mint e-commerce-api** `docs/KEYCLOAK.md`: create a public client (e.g. `mint-ecommerce`) with redirect URIs and web origins pointing to your Next.js app (e.g. `http://localhost:3000`). Set the API’s `KEYCLOAK_ALLOWED_RESOURCES=mint-ecommerce` and `CORS_ALLOWED_ORIGINS=http://localhost:3000`.

## 2. Running

1. Start **Mint e-commerce-api** (Laravel) and Keycloak.
2. Run the UI: `npm run dev`.
3. Open `/admin` → redirects to `/admin/login` if not signed in.
4. Click **Sign in with Keycloak** → redirect to Keycloak → after login, back to `/admin`.
5. Select or create a store (header store switcher or **Add store**). All store-scoped requests send **X-Store-Id**.

## 3. What’s connected

- **Auth:** Keycloak via NextAuth; access token stored in session and sent as `Authorization: Bearer <token>`.
- **Stores:** `GET /api/me/stores`, `POST /api/me/stores` (create). Store chosen in UI and sent as `X-Store-Id`.
- **Dashboard:** Recent orders and product count from `GET /api/store/orders`, `GET /api/store/products`.
- **Products:** List (with search, status, pagination), add product (`POST /api/store/products`).
- **Orders:** List (with status filter, pagination), order detail `GET /api/store/orders/:id`.
- **Customers:** List from `GET /api/store/customers`.
- **Statistics / Finance:** Placeholder UI; can be wired when reporting endpoints exist.

## 4. API route added (backend)

- **POST /api/store/products** — Create product (title, description, status; slug optional). Implemented in **Mint e-commerce-api** `routes/api.php`.
