# Admin panel — additions and improvements

Ideas for **new features** and **improvements** to the existing admin. Grouped by what can be done with the current API vs what needs backend changes.

---

## 1. Additions (new features)

### Frontend-only (current API is enough)

| Addition | Description | Effort |
|----------|-------------|--------|
| **Search / global command** | Header search: type to find orders (#), products, or customers; quick links to open them. | Small |
| **Low-stock alert on dashboard** | On Home, show “X products low on stock” (from product variants) and link to products filtered by low stock. | Small |
| **Order status quick-edit** | On order detail, dropdown to change `financial_status` or `fulfillment_status` if API supports PATCH order. | Small (if API has PATCH order) |
| **Customer search** | Customers list: add search-by-email or name (API may already support `search`). | Small |
| **Products: duplicate product** | “Duplicate” on product row or edit page: clone product via GET then POST with new title. | Small |
| **Date range picker for Analytics/Finance** | Custom from/to dates instead of only preset ranges (week/month/quarter/year). | Small |
| **Finance: export more formats** | Export as JSON or Excel in addition to CSV. | Small |
| **Stores list page** | `/admin/stores` listing the user’s stores (from `GET /me/stores`) with link to create new. | Small |
| **My account / profile** | Page showing `GET /me` (name, email) and maybe “Change password” link to Keycloak. | Small |

### Needs API (backend first)

| Addition | Description | API needed |
|----------|-------------|------------|
| **Bulk actions (products)** | Select multiple products → bulk status change (active/draft/archived) or delete. | `PATCH /store/products/bulk` or `DELETE /store/products/bulk` |
| **Bulk actions (orders)** | Select orders → bulk tag or status update. | `PATCH /store/orders/bulk` |
| **Delete product** | “Delete product” on edit page. | `DELETE /store/products/{id}` |
| **Delete / archive order** | Soft-delete or archive order. | `PATCH /store/orders/{id}` (e.g. status) or `DELETE` |
| **Store deletion** | “Delete store” in settings or store list. | `DELETE /me/stores/{id}` |
| **Expenses in Finance** | Track expenses; show profit and margin. | Models + `GET/POST /store/expenses` or similar |
| **Dedicated analytics API** | Server-side aggregation for large datasets (e.g. revenue by day for 1 year). | `GET /store/analytics/overview?from=&to=` etc. |
| **Inventory history** | Log of inventory changes per variant. | `GET /store/products/variants/{id}/inventory-history` |
| **Customer create / edit** | Create customer or edit email, name, phone from admin. | `POST /store/customers`, `PATCH /store/customers/{id}` |
| **Order edit** | Edit line items, totals, or customer on existing order. | `PATCH /store/orders/{id}` (extended) |
| **Notifications / activity log** | In-app feed of recent events (new order, low stock, etc.). | `GET /store/activity` or events table |

---

## 2. Improvements (existing pages)

### UX and polish

| Area | Improvement |
|------|-------------|
| **All list pages** | Sticky table header on scroll; row hover state; clearer empty states with illustration or CTA. |
| **Orders list** | Filters: by date range, fulfillment status; show created_at in local time. |
| **Order detail** | Print-friendly view (e.g. “Print” button); copy order number; link “Email customer” (mailto). |
| **Products list** | Thumbnail column if API returns image URL; “Quick edit” status in table (dropdown without leaving list). |
| **Product add/edit** | Image upload if API supports it; slug editable; validation messages per field. |
| **Customers list** | Sort by name, email, total spent, orders count; show last order date if API provides it. |
| **Customer detail** | List of orders for this customer (filter orders by customer email or ID if API allows). |
| **Settings** | Confirm before deactivating store (“Are you sure?” modal); show last saved timestamp. |
| **Dashboard (Home)** | Configurable widgets or “Refresh” button; link each stat to the right list (e.g. revenue → Finance). |
| **Analytics** | Tooltip on chart bars (exact value); compare to previous period (e.g. “vs last month”). |
| **Finance** | Tooltip on revenue-by-item bars; “Print report” layout. |

### Performance and data

| Area | Improvement |
|------|-------------|
| **Analytics / Finance** | Fetch more pages of orders (e.g. 2–3 pages of 100) when “Last 12 months” is selected, or add “Load more” for accuracy. |
| **Products list** | Virtualized table or pagination with larger per_page for faster scanning. |
| **Dashboard** | Cache store stats for 1–2 minutes to avoid refetch on every visit. |
| **All API calls** | Retry on network failure; show “Offline” banner when fetch fails. |

### Accessibility and mobile

| Area | Improvement |
|------|-------------|
| **Global** | Ensure all interactive elements have focus styles and aria-labels; sidebar closes on route change on mobile. |
| **Tables** | Responsive: cards on small screens instead of table, or horizontal scroll with sticky first column. |
| **Forms** | Clear error messages; associate every input with a label; avoid timeouts that block submit. |

### Consistency

| Area | Improvement |
|------|-------------|
| **Design** | One shared component set for cards, buttons, inputs, badges (e.g. status pills) across Home, Orders, Products, Customers, Settings, Analytics, Finance. |
| **Copy** | Same terminology everywhere (e.g. “Deactivate” vs “Pause”); help text for filters and exports. |
| **Navigation** | Breadcrumbs on detail pages (e.g. Orders > #1234); highlight current section in sidebar. |

---

## 3. Suggested order (if you implement step by step)

1. **Quick wins (frontend-only)**  
   - Stores list page (`/admin/stores`).  
   - Low-stock alert on dashboard.  
   - Customer search on customers list.  
   - Date range picker for Analytics/Finance.

2. **API + UI**  
   - Delete product (`DELETE /store/products/{id}` + button on edit page).  
   - Order status quick-edit (if `PATCH /store/orders/{id}` exists or is added).  
   - Customer create/edit if API is extended.

3. **Polish**  
   - Sticky headers and better empty states.  
   - Print view for order detail.  
   - Confirm before deactivating store.

4. **Larger additions**  
   - Bulk actions (once API supports them).  
   - Expenses and profit in Finance.  
   - Activity feed / notifications.

---

## Summary

- **Additions:** Search, low-stock alert, stores list, profile, duplicate product, date range picker, more exports (frontend). Plus bulk actions, delete product/order, store delete, expenses, analytics API, customer create/edit (need API).
- **Improvements:** UX (filters, print, confirmations, tooltips), performance (caching, more data for long ranges), accessibility and mobile, and consistent design and copy.

You can pick from this list and implement in the order above, or mix “quick wins” with one or two API-backed features.
