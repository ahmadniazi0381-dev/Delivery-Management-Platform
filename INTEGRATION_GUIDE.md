# Address Modal Integration Guide

## Quick Start

### Files Created/Modified

1. **NEW: `website/src/components/AddressModal.tsx`**
   - Standalone reusable address selection component
   - Handles all map interactions, autocomplete, and delivery radius checking
   - Includes reverse geocoding for marker dragging

2. **UPDATED: `website/src/components/Providers.tsx`**
   - Added GoogleMapsProvider wrapper
   - Now loads Google Maps API globally once

3. **UPDATED: `website/src/app/checkout/page.tsx`**
   - Removed inline Google Maps code (70+ lines)
   - Removed manual state variables for coordinates
   - Uses AddressModal component for address selection
   - Simplified address display and management

## Architecture

```
┌─────────────────────────────────────┐
│  Checkout Page                      │
│  ├─ Address Display Section         │
│  │  └─ "Add/Change" → Opens Modal   │
│  │  └─ Saved Addresses List         │
│  ├─ Order Form                      │
│  └─ Order Summary                   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  AddressModal Component             │
│  ├─ Search Input (Autocomplete)     │
│  ├─ Interactive Map                 │
│  │  ├─ Marker (Draggable)           │
│  │  └─ Click to Pin                 │
│  ├─ Optional Details Form           │
│  │  ├─ Apartment/Floor              │
│  │  ├─ Landmark                     │
│  │  └─ Delivery Note                │
│  ├─ Address Type Selector           │
│  ├─ Delivery Status Display         │
│  └─ Save/Cancel Actions             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  GoogleMapsProvider (Context)       │
│  └─ Handles Google Maps API Loading │
└─────────────────────────────────────┘
```

## Data Flow

### User Saves Address
```
User Input (Address Selection)
    ↓
AddressModal Component
    ├─ Auto-validate delivery radius
    ├─ Extract place details
    ├─ Call onSave callback
    └─ Return AddressData object
         ↓
    Checkout Page.handleSaveAddress()
         ├─ POST to /api/addresses
         ├─ Fetch updated addresses list
         └─ Update UI with new address
         
AddressData Object Structure:
{
  label: "Home",
  addressLine: "123 Main St, Karachi",
  apartment: "Apt 5",
  floor: "3rd",
  landmark: "Near mosque",
  deliveryNote: "Ring bell 3 times",
  latitude: 31.5497,
  longitude: 74.3436,
  placeId: "ChIJI...",
  postalCode: "75500",
  city: "Karachi",
  province: "Sindh",
  country: "Pakistan",
  isDeliverable: true,
  distanceKm: 1.2
}
```

### User Selects Existing Address
```
Checkout Page
    └─ Saved Addresses List
         └─ Click address
              ↓
    selectSavedAddress(address)
         ├─ setSelectedAddressId()
         ├─ setIsEligible()
         └─ setDistanceInfo()
              ↓
    UI Updates with Selected Address
```

## API Endpoints Used

### Save New Address
```
POST /api/addresses
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  label: "Home",
  addressLine: "123 Main St, Karachi",
  apartment: "Apt 5",
  floor: "3rd",
  landmark: "Near mosque",
  deliveryNote: "Ring bell 3 times",
  latitude: 31.5497,
  longitude: 74.3436,
  placeId: "ChIJI...",
  postalCode: "75500",
  city: "Karachi",
  province: "Sindh",
  country: "Pakistan",
  isDefault: false
}

Response:
{
  success: true,
  data: {
    id: "addr_123",
    ...addressData,
    isDeliverable: true,
    distanceKm: 1.2,
    createdAt: "2024-01-15T10:30:00Z"
  }
}
```

### Fetch Addresses
```
GET /api/addresses
Authorization: Bearer {token}

Response:
{
  success: true,
  data: [
    {
      id: "addr_1",
      label: "Home",
      addressLine: "123 Main St",
      latitude: 31.5497,
      longitude: 74.3436,
      isDefault: true,
      isDeliverable: true,
      distanceKm: 1.2
    },
    ...
  ]
}
```

### Check Delivery Eligibility (Called by AddressModal)
```
POST /api/addresses/check-eligibility
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  latitude: 31.5497,
  longitude: 74.3436
}

Response:
{
  success: true,
  data: {
    eligible: true,
    distanceKm: 1.2,
    estimatedMinutes: "20-35"
  }
}
```

## Environment Variables Required

In `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_KEY=YOUR_GOOGLE_MAPS_API_KEY
```


## Features Implemented

### ✅ Complete Feature List

1. **Smart Autocomplete**
   - Google Places autocomplete for Pakistan
   - Auto-extracts postal code, city, province, country
   - Filters to Pakistan only

2. **Interactive Map**
   - Drag marker to adjust location
   - Click map to set new location
   - Smooth transitions and animations

3. **Reverse Geocoding**
   - Auto-converts coordinates to address
   - Updates after marker drag
   - Updates after map click

4. **Automatic Delivery Check**
   - Checks radius after place selection
   - Checks after marker drag
   - Checks after map click
   - No manual button needed

5. **Rich Address Details**
   - Apartment/Unit number
   - Floor number
   - Landmark reference
   - Delivery instructions
   - Google Place ID for future use

6. **Visual Feedback**
   - Green banner for deliverable addresses
   - Red banner for outside radius
   - Distance display in km
   - Estimated delivery time

7. **User Experience**
   - Current location button
   - Optional fields for flexibility
   - Address type selection (Home/Work/Hostel/Other)
   - Clean, modern modal design

8. **Error Handling**
   - Graceful API error handling
   - Geolocation permission errors
   - Network error messages
   - Form validation

## Performance Optimizations

1. **Google Maps Loaded Once**
   - Context provider loads globally
   - Prevents duplicate script loading
   - Shared across all components

2. **Lazy Reverse Geocoding**
   - Only triggered on drag/click
   - Debounced if needed
   - No unnecessary API calls

3. **Efficient Re-renders**
   - Component uses React hooks properly
   - Memoized selectors
   - Dependency arrays optimized

## Customization Options

### Change Delivery Radius
Edit in `AddressModal.tsx`:
```typescript
const DELIVERY_RADIUS_KM = 2.2; // Change this value
```

### Change Shop Location
Edit in both files:
```typescript
const SHOP_LAT = 31.4475531;
const SHOP_LNG = 74.2690347;
```

### Change Autocomplete Country
Edit in `AddressModal.tsx`:
```typescript
componentRestrictions: { country: "pk" } // Change "pk" to other ISO country code
```

### Customize Address Labels
Edit in `AddressModal.tsx`:
```typescript
{["Home", "Work", "Hostel", "Other"].map((type) => (
  // Change labels here
))}
```

## Troubleshooting

### Map Not Showing
- Check Google Maps API key is set
- Check API key has Maps JavaScript API enabled
- Check Places API is enabled in Console

### Autocomplete Not Working
- Verify API key enables Places API
- Check browser network tab for API calls
- Verify "pk" country restriction if needed

### Delivery Status Not Updating
- Check `/api/addresses/check-eligibility` endpoint works
- Verify token is sent with request
- Check backend calculates distance correctly

### Coordinates Showing in Old Code
- Update any remaining references to `lat`, `lng` state
- These are no longer used in checkout page
- Only AddressModal manages coordinates now

## Migration Checklist

If you had previous code using coordinates:

- [ ] Remove all manual `lat`/`lng` state from checkout
- [ ] Remove all manual Google Maps initialization code
- [ ] Remove latitude/longitude input fields from forms
- [ ] Remove "Check Radius" buttons
- [ ] Update any UI that displayed raw coordinates
- [ ] Verify backend accepts new address structure
- [ ] Test address saving flow end-to-end
- [ ] Test address selection flow
- [ ] Test order placement with addresses

## Future Enhancements

1. **Edit Existing Addresses**
   - Reopen modal with existing address
   - Pre-fill all fields
   - Allow updates to any field

2. **Address History**
   - Track frequently used addresses
   - Suggest based on usage patterns

3. **Delivery Area Visualization**
   - Show delivery zone on map
   - Highlight undeliverable areas
   - Visual radius circle

4. **Geofencing**
   - Pre-warn if outside area
   - Prevent saving outside addresses

5. **Address Validation**
   - Validate postal codes
   - Verify addresses against database
   - Duplicate detection

6. **Advanced Delivery Instructions**
   - Template-based instructions
   - Photo upload for building reference
   - Recurring instructions

---

## Questions?

Refer to:
- **AddressModal.tsx** for component implementation details
- **checkout/page.tsx** for integration example
- **GoogleMapsContext.tsx** for API loading details
- **TESTING_CHECKLIST.md** for comprehensive testing guide
