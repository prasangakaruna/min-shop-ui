# Admin panel — API coverage

All admin-related **Mint e-commerce-api** endpoints are connected to the admin UI.

## Connected (API-backed)

| API endpoint | Admin usage |
|--------------|-------------|
| `GET /api/me/stores` | Store switcher, store list (StoreContext) |
| `POST /api/me/stores` | Create store (`/admin/stores/new`) |
| `GET /api/store` | Store settings — load current store |
| `PATCH /api/store` | Store settings — update name, email, plan, is_active |
| `GET /api/store/orders` | Dashboard, Orders list (filters & pagination) |
| `POST /api/store/orders` | Create order (`/admin/orders/new`) |
| `GET /api/store/orders/{id}` | Order detail (`/admin/orders/[id]`) |
| `GET /api/store/products` | Dashboard, Products list (search, status, pagination) |
| `POST /api/store/products` | Add product (`/admin/products/add`) |
| `GET /api/store/products/{id}` | Edit product — load product |
| `PATCH /api/store/products/{id}` | Edit product — update title, description, status |
| `PATCH /api/store/products/variants/{id}` | Edit product — update variant inventory |
| `GET /api/store/customers` | Customers list (pagination) |
| `GET /api/store/customers/{id}` | Customer detail (`/admin/customers/[id]`) |

## Admin routes

| Route | Description |
|-------|-------------|
| `/admin` | Home dashboard |
| `/admin/orders` | Orders list + “Create order” button |
| `/admin/orders/new` | Create order (manual) |
| `/admin/orders/[id]` | Order detail |
| `/admin/products` | Products list |
| `/admin/products/add` | Add product |
| `/admin/products/edit/[id]` | Edit product + variant inventory |
| `/admin/customers` | Customers list |
| `/admin/customers/[id]` | Customer detail |
| `/admin/settings` | Store settings (name, email, plan, is_active) |
| `/admin/stores/new` | Create store |
| `/admin/statistics` | Analytics (placeholder) |
| `/admin/finance` | Finance (placeholder) |

## API routes added (Mint e-commerce-api)

- `GET /api/store/products/{id}` — get single product (for edit page).
- `PATCH /api/store/products/{id}` — update product (title, description, status).
