# Admin panel — status (Shopify-like scope)

The admin panel now has **all core areas implemented** with real API data, in a simpler Shopify-like scope.

---

## ✅ Implemented (API-backed or derived from orders)

| Area | Route | What it does |
|------|--------|---------------|
| **Home** | `/admin` | Dashboard: store stats, recent orders, quick actions, store card, date |
| **Orders** | `/admin/orders`, `/admin/orders/new`, `/admin/orders/[id]` | List (filters, pagination), create order, order detail |
| **Products** | `/admin/products`, `/admin/products/add`, `/admin/products/edit/[id]` | List (search, status), add product, edit + variant inventory |
| **Customers** | `/admin/customers`, `/admin/customers/[id]` | List (pagination), customer detail |
| **Settings** | `/admin/settings` | Store name, email, plan, plan price, activate/pause store |
| **Analytics** | `/admin/statistics` | Key metrics, revenue/orders trends, top items by revenue (from orders) |
| **Finance** | `/admin/finance` | Revenue stats, revenue by item, recent transactions (orders), period table, CSV export |
| **Stores** | `/admin/stores/new` | Create store; store switcher in header |
| **Auth** | `/admin/login` | Keycloak (NextAuth), sign out |

All of the above use the **Mint e-commerce-api** (auth, store context). Analytics and Finance use **existing order/customer APIs** (no dedicated reporting API); data is derived from `GET /store/orders` and `GET /store/customers`.

---

## Optional / not in scope (simpler than Shopify)

- **Admin signup** – Users typically come from Keycloak; `/admin/signup` can stay as redirect or info.
- **Store deletion / transfer** – No “Delete store” or “Transfer ownership” in UI or API.
- **Bulk actions** – No bulk edit/delete for products or orders.
- **Expenses / profit** – Finance shows revenue only; no expense tracking in API.
- **Dedicated reporting API** – Analytics/Finance compute from paginated orders (e.g. last 100); no server-side aggregation yet.
- **Notifications / activity log** – No in-app notifications or activity feed.

---

## Summary

**Yes — the admin panel is complete for a simpler, Shopify-like scope.** You have:

- **Home** (dashboard)
- **Orders** (list, create, detail)
- **Products** (list, add, edit, inventory)
- **Customers** (list, detail)
- **Settings** (store + plan + price + active/pause)
- **Analytics** (metrics, trends, top items)
- **Finance** (revenue, transactions, export)
- **Multi-store** (switcher + create store)
- **Auth** (Keycloak login, sign out)

Anything beyond that (bulk actions, expenses, store delete, dedicated reporting API) is optional polish.
