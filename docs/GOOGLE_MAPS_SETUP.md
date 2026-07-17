# Google Maps Setup (Website)

The address picker uses the **Maps JavaScript API** + **Places API (New)**.
Checkout mini-preview uses the **Maps Static API**.

## Required Google Cloud APIs

Enable in [Google Cloud Console](https://console.cloud.google.com/apis/library):

1. Maps JavaScript API
2. Places API (New)
3. Geocoding API (for reverse geocode on map drag/click)
4. Maps Static API (checkout preview)

Billing must be enabled on the project.

## Environment variables

Website (Vercel / `.env.local`):

```env
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_browser_key
# alias also supported:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key
```

## HTTP referrer restrictions (browser key)

Restrict the key to:

- `http://localhost:3000/*`
- `https://YOUR_VERCEL_APP.vercel.app/*`
- `https://*.vercel.app/*` (optional for previews)

## Common “Oops! Something went wrong” causes

1. Keyless Google embed iframe (fixed — checkout now uses Static Maps)
2. Maps script `libraries` joined without commas (`mapsplaces`) — fixed
3. Places event `gmp-placeselect` outdated — now also listens for `gmp-select`
4. Billing disabled / API not enabled
5. Referrer restriction blocks your Vercel domain
6. Wrong / missing `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

## Manual check

1. Open checkout → Add address
2. Map canvas should render (not gray Oops panel)
3. Search should select a place and move the pin
4. Checkout card should show a static map image for the selected pin
