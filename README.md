# Egg Shop Manager

A mobile-first app for an egg **wholesale and retail** shop. The shop uses it to manage customers, credit, orders, stock, empty trays and profit. It is designed for a village shop owner with no technical background, so it uses large buttons, simple **Tamil and English**, and a clean premium UI.

> The code ships with **demo shop details and demo data**. Every shop sets its real name, phone, address, UPI QR and rates in *Settings*.

## Roles
| Role | Login | Can do |
|---|---|---|
| **Owner** | 4-digit PIN | Everything: billing, rates, stock, credit, staff, reports, settings |
| **Staff** | Staff ID + PIN | Billing, deliveries, credit collection, trays (no profit or rate changes) |
| **Customer** | Customer ID + PIN | Place orders, see their balance, bills and payments, pay by UPI QR |

Demo logins: Owner PIN `1234` · Staff `S01` / `2222` · Customer `C001` / `1111`

## Features
- **Billing.** Quick buttons for +1, 6, 10, 12 eggs or 1 tray (30 eggs). Retail, wholesale and special per-customer rates. Pay by cash, UPI, credit or part payment. Bills shared on WhatsApp or printed.
- **Credit (கடன்).** Balance per customer, ageing badges, one-tap WhatsApp reminders, payment collection.
- **Orders.** Customers order from their phone. The owner accepts and assigns delivery staff, and the order becomes a bill on delivery.
- **Stock with FIFO lots.** Each purchase keeps its own cost per egg, so profit is accurate. Broken eggs are recorded as a loss at their real cost.
- **Empty trays.** Tracks who holds how many trays, with given/returned entries and reminders.
- **Suppliers, expenses and staff.** Supplier dues and payments, shop expenses by type, staff IDs and PINs, and each person's work for the day.
- **Reports.** Today, 7 days, month, year or all time. Profit explained in plain words (*sales − cost − broken − expenses*), charts, top customers, Excel (CSV) export and print/PDF.
- **Activity log.** Records who did what, and when.
- **Backup and restore**, light/dark theme, and an installable **PWA**.

## Tech Stack
React 18 · Vite · IndexedDB (data layer behind a single store, ready to swap to Firebase Firestore) · PWA · inline SVG icon set · CSS (no UI library)

## Run locally
```bash
npm install
npm run dev      # http://localhost:5190
npm run build    # production build in dist/
```

## Author
**Yasir S A** — Full Stack Developer · [GitHub](https://github.com/yasir-sa) · [LinkedIn](https://linkedin.com/in/yasir-sa)
