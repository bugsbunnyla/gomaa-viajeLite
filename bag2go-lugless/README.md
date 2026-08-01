# gomaa-bag2go

A cross-platform PWA (Progressive Web App) for door-to-door luggage and shipping with multi-stop deliveries, split shipments, delayed pickup/delivery windows, and unified carrier rate shopping.

## Color Palette
- **Burgundy** `#800020` — Primary brand color, headers, active states
- **Peach** `#FFDAB9` — Secondary accent, highlights, selected backgrounds  
- **White** `#FFFFFF` — Main backgrounds
- **Black** `#000000` — Primary text, bold on selected elements

## Features

### Booking Wizard (5 Steps)
1. **Pickup & Delivery Stops** — Configure pickup address and unlimited delivery stops
2. **Weight & Dimensions** — Visual weight picker + dimensional weight calculation
3. **Delivery Window** — Same Day, Next Day, 3-Day, 5-Day, Custom, International + delayed hold
4. **Carrier & Payment** — Rate shop across FedEx, UPS, DHL, Amazon with 8 payment methods
5. **Confirm** — Full review before booking

### Core Capabilities
- ✅ **Multi-stop delivery** — 1 pickup → N destinations
- ✅ **Split shipment mode** — Toggle with $5 per additional stop
- ✅ **Pickup address ≠ primary address** — Fully independent address entry
- ✅ **Delayed pickup/hold at destination** — Schedule hold until date + release time
- ✅ **Custom delivery windows** — Date range selection beyond standard SLAs
- ✅ **International shipping** — Cross-border with customs-aware routing
- ✅ **Carrier broker layer** — Configurable endpoints for FedEx, UPS, DHL, Amazon
- ✅ **8 payment methods** — Card, Cash, Wallet, UPI, Zelle, Klarna, Karma, PayAPerson
- ✅ **Live rate engine** — Mock rates (swap for real APIs in Settings)
- ✅ **Tracking** — Enter any B2G or carrier tracking number
- ✅ **Shipment history** — View past bookings with status
- ✅ **Address book** — Save and manage frequent addresses
- ✅ **Offline support** — Service worker caches core assets

## Installation

### iOS (iPhone/iPad)
1. Open `index.html` in Safari (or deploy to a web server)
2. Tap the **Share** button
3. Scroll down and tap **"Add to Home Screen"**
4. The app installs as a full-screen PWA with burgundy theme

### Android
1. Open `index.html` in Chrome (or deploy to a web server)
2. Tap the menu (⋮) and select **"Add to Home screen"**
3. The app installs with native launcher icon and splash screen

### Web
1. Serve the folder via any static web server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
2. Open `http://localhost:8080`

## File Structure
```
gomaa-bag2go/
├── index.html          # Main app shell
├── manifest.json       # PWA manifest
├── sw.js              # Service worker (offline cache)
├── css/
│   └── styles.css     # Complete theme + responsive layout
├── js/
│   └── app.js         # All application logic
└── assets/icons/      # PWA icons (PNG, multi-resolution)
```

## User Guide

### Booking a Shipment
1. **Book Tab** → Enter pickup address (can be any address, not your saved home)
2. Toggle **Split Shipment** if sending to multiple destinations
3. Add delivery stops with recipient details
4. **Continue** → Select weight visually or enter exact lbs
5. Enter dimensions for dimensional weight pricing
6. **Continue** → Choose speed (Same Day through International)
7. For delayed delivery, set **Hold Until Date** and release time
8. **Continue** → Tap **Refresh Rates** to see live carrier quotes
9. Select carrier and payment method
10. **Review & Confirm** → Verify all details → **Book Shipment Now**

### Tracking
- Go to **Track** tab, enter tracking number (e.g., `B2G-A7K3M9P2`)
- View real-time status, carrier, route, and last update

### Settings
- Go to **Settings** tab
- Enter your real carrier API endpoints and keys
- Configure notification preferences and currency

### Business Cases
| Scenario | How to Use |
|----------|-----------|
| Moving luggage to hotel | Pickup = home, Stop 1 = hotel, Same Day |
| Sending gifts to 3 family members | Enable Split Shipment, add 3 stops, 5-Day |
| Delayed delivery while on vacation | Set Hold Until Date to your return date |
| International relocation | Select International speed, enter overseas address |
| Office pickup, home delivery | Pickup = office address (not your saved home) |
| Cash payment on pickup | Select Cash payment, pay driver at door |

## Connecting Real Carrier APIs

In **Settings**, configure:
- **FedEx**: `https://apis.fedex.com` + API Key/Secret
- **UPS**: `https://onlinetools.ups.com` + API Key/Secret  
- **DHL**: `https://api-eu.dhl.com` + API Key/Secret
- **Amazon**: `https://sellingpartnerapi-na.amazon.com` + API Key/Secret

Then replace the `fetchRates()` mock in `js/app.js` with actual `fetch()` calls to your configured endpoints.

## Tech Stack
- Pure HTML5/CSS3/Vanilla JavaScript (zero dependencies)
- Progressive Web App (manifest + service worker)
- Responsive grid (mobile-first, breakpoints at 640px, 768px, 1024px)
- CSS custom properties for theming
- LocalStorage for carrier config persistence

## License
MIT — Free to use, modify, and deploy.
