# What’s left to create — checklist

Use this list to pick what to build next. **Frontend-only** items work with the current API. **Needs API** items require backend changes first.

---

## Frontend-only — implemented

| # | What to create | Where | Notes |
|---|----------------|--------|--------|
| 1 | **Stores list page** | `/admin/stores` | New page: list user’s stores from `GET /me/stores`, link “Create store” to `/admin/stores/new`. Add “Stores” in sidebar. |
| 2 | **Low-stock alert on dashboard** | `/admin` (Home) | Fetch products (or use existing), count variants with `inventory_quantity` &lt; threshold (e.g. 10). Show card “X products low on stock” → link to products. |
| 3 | **Customer search** | `/admin/customers` | Add search input; call `GET /store/customers?search=...` (if API supports `search` param). |
| 4 | **Duplicate product** | Products list or edit page | Button “Duplicate”: GET product, POST new with same data and title like “Copy of …”. |
| 5 | **Date range picker** | Analytics + Finance | Add “Custom range” with from/to date inputs; filter orders by that range. |
| 6 | **My account / profile** | `/admin/account` or `/admin/profile` | New page: show `GET /me` (name, email), optional “Change password” link to Keycloak. Add link in header user menu. |
| 7 | **Confirm before deactivate store** | `/admin/settings` | When turning store “off”, show modal “Are you sure? Store won’t be visible.” Confirm/Cancel. |
| 8 | **Print order** | `/admin/orders/[id]` | “Print” button that opens print-friendly view (order number, date, line items, total). |
| 9 | **Finance: export JSON** | `/admin/finance` | In addition to “Export CSV”, add “Export JSON” for orders in range. |

---

## Needs API first (backend then frontend) — implemented

| # | What to create | API needed | Then in admin |
|---|----------------|------------|----------------|
| 10 | **Delete product** | `DELETE /store/products/{id}` | On product edit page: “Delete product” + confirm. |
| 11 | **Order status edit** | `PATCH /store/orders/{id}` (status fields) | On order detail: dropdown to change financial_status or fulfillment_status. ✓ |
| 12 | **Customer create** | `POST /store/customers` | New page `/admin/customers/new` + form. ✓ |
| 13 | **Customer edit** | `PATCH /store/customers/{id}` | On customer detail: edit email, name, phone. ✓ |
| 14 | **Store deletion** | `DELETE /me/stores/{id}` | On stores list or settings: “Delete store” + confirm. |
| 15 | **Bulk product actions** | e.g. `PATCH /store/products/bulk` | Products list: checkboxes, “Change status” or “Delete selected”. |

---

## Suggested order to start

**Phase 1 (no API work)**  
1. **Stores list page** (#1) — new page, high value.  
2. **Low-stock alert on dashboard** (#2).  
3. **Confirm before deactivate store** (#7).  
4. **Customer search** (#3) — if API already has `search` on customers.  
5. **My account / profile** (#6).

**Phase 2 (still frontend-only)**  
6. **Duplicate product** (#4).  
7. **Date range picker** (#5).  
8. **Print order** (#8).  
9. **Finance export JSON** (#9).

**Phase 3 (after API)**  
10. **Delete product** (#10).  
11. **Order status edit** (#11).  
12. **Customer create/edit** (#12–13).  
13. **Store deletion** (#14).  
14. **Bulk product actions** (#15).

---

## Quick reference

- **Already exist:** Home, Orders (list/new/detail), Products (list/add/edit), Customers (list/detail), Settings, Analytics, Finance, Create store, Login.  
- **Create next (recommended):** Stores list (#1), low-stock on dashboard (#2), confirm deactivate (#7), then customer search (#3) and profile (#6).  
- **Need backend:** Delete product, order PATCH, customer POST/PATCH, store DELETE, bulk product endpoints.

Pick an item from the table and we can implement it step by step.
