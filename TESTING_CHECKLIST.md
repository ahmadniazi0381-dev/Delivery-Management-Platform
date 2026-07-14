# Address Modal Testing Checklist

## Component Functionality Tests

### Autocomplete & Place Selection
- [ ] Search for an address in the modal
- [ ] Select an address from autocomplete suggestions
- [ ] Verify coordinates are auto-filled
- [ ] Verify address line is populated
- [ ] Verify delivery radius is auto-checked

### Map Interactions
- [ ] Drag the marker on the map
- [ ] Verify coordinates update
- [ ] Verify address updates via reverse geocoding
- [ ] Verify delivery radius is rechecked on drag
- [ ] Click on map to set new location
- [ ] Verify marker moves to clicked location

### Current Location
- [ ] Click "Use Current Location" button
- [ ] Verify geolocation permission prompt appears (if first time)
- [ ] Verify coordinates are fetched
- [ ] Verify address is reverse geocoded
- [ ] Verify delivery radius is checked

### Optional Fields
- [ ] Fill apartment field
- [ ] Fill floor field
- [ ] Fill landmark field
- [ ] Fill delivery note field
- [ ] Verify all fields are optional (can save without them)

### Address Type Labels
- [ ] Click each label (Home, Work, Hostel, Other)
- [ ] Verify selected label is highlighted
- [ ] Verify label is included in saved address

### Delivery Status Display
- [ ] View delivery status when inside radius
- [ ] View delivery status when outside radius
- [ ] Verify distance is displayed in km
- [ ] Verify estimated delivery time shows for valid addresses
- [ ] Verify error message shows for outside delivery area

### Save & Validation
- [ ] Try to save without selecting an address
- [ ] Verify error message appears
- [ ] Try to save an outside-delivery-radius address
- [ ] Verify error message and disabled save button
- [ ] Successfully save a valid address
- [ ] Verify address appears in checkout page

### Checkout Integration Tests

### Address Display
- [ ] Open checkout page with existing address
- [ ] Verify address displays correctly
- [ ] Verify apartment/floor/landmark display if saved
- [ ] Verify delivery status displays

### Address Management
- [ ] Click "Change" button in delivery section
- [ ] Verify modal opens
- [ ] Verify saved addresses list shows
- [ ] Click on saved address to select it
- [ ] Verify checkout page updates with selected address
- [ ] Click "Add new address" button
- [ ] Verify fresh modal opens for new address

### Order Placement
- [ ] Fill all required fields (name, phone, payment method)
- [ ] Try to place order without address
- [ ] Verify error message
- [ ] Select valid address
- [ ] Place order successfully
- [ ] Verify address ID is sent to backend

### Error Handling

### API Errors
- [ ] Simulate API down (check network errors handled gracefully)
- [ ] Verify error messages display to user
- [ ] Verify user can try again

### Geolocation Errors
- [ ] Deny geolocation permission
- [ ] Verify error message appears
- [ ] Verify user can still use search

### Google Maps Errors
- [ ] Test with invalid API key (should show context error)
- [ ] Test without API key (should show context error)

### Performance Tests

### Map Rendering
- [ ] Verify map loads smoothly
- [ ] Verify no layout shift when modal opens
- [ ] Verify no lag when dragging marker
- [ ] Verify autocomplete responds quickly

### Memory
- [ ] Open/close modal multiple times
- [ ] Verify no memory leaks (check DevTools)

### Mobile Tests

### Responsive Layout
- [ ] View on mobile screen (375px width)
- [ ] Verify modal fits screen
- [ ] Verify all buttons are touchable
- [ ] Verify map is interactive on touch

### Geolocation on Mobile
- [ ] Request current location on mobile
- [ ] Verify geolocation works
- [ ] Verify smooth experience

### Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all inputs
- [ ] Tab through all buttons
- [ ] Verify focus indicators visible
- [ ] Enter key closes modal (Escape)

### Screen Reader
- [ ] Test with screen reader
- [ ] Verify modal is announced
- [ ] Verify form fields are labeled
- [ ] Verify error messages are announced

### Dark Mode (if applicable)
- [ ] Test modal in dark mode
- [ ] Verify all text readable
- [ ] Verify buttons visible
- [ ] Verify map readable

## Backend Integration Tests

### Address Save
- [ ] Verify address saved to database
- [ ] Verify all fields stored correctly
- [ ] Verify coordinates accurate

### Address Retrieval
- [ ] Fetch addresses list
- [ ] Verify saved address appears
- [ ] Verify all details included

### Delivery Radius Check
- [ ] Send valid coordinates
- [ ] Verify returns eligible=true/false
- [ ] Verify distance is accurate
- [ ] Send invalid coordinates
- [ ] Verify handles errors gracefully

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Visual Design Tests

### Styling
- [ ] Green highlight for selected address
- [ ] Green banner for deliverable status
- [ ] Red banner for non-deliverable status
- [ ] Proper spacing and alignment
- [ ] Icons/emojis display correctly
- [ ] Fonts render correctly

### Color Contrast
- [ ] Text readable on all backgrounds
- [ ] Focus indicators visible
- [ ] Status colors distinguish clearly

---

## Notes for QA Team

### Test Data
- Use address: "Marjan Girls Hostel, Karachi" (should be in radius)
- Use address: "Far away location" (should be outside radius)
- Use current location with GPS enabled device

### Known Limitations
- Autocomplete only works for Pakistan (hardcoded in component)
- Reverse geocoding may take 1-2 seconds
- Map requires internet connection

### Success Criteria
- ✅ All addresses save correctly
- ✅ Delivery radius check works accurately
- ✅ Map interactions are smooth
- ✅ No JavaScript errors in console
- ✅ Mobile experience is usable
- ✅ Accessibility features work

---

**Test Date**: ___________
**Tester Name**: ___________
**Status**: 🔴 Not Started | 🟡 In Progress | 🟢 Passed | 🔴 Failed

**Issues Found**:
- [ ] Issue #1: ___________
- [ ] Issue #2: ___________
- [ ] Issue #3: ___________
