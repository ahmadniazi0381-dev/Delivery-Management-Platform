import { calculateHaversineDistance, isWithinDeliveryRadius } from './services/distance.service';

const shopLat = 31.4475531;
const shopLng = 74.2690347;

console.log('--- STARTING HAVERSINE DISTANCE SERVICE TESTS ---');

// Test Case 1: Point extremely close (UCP campus, approx 150m away)
const ucpLat = 31.446820;
const ucpLng = 74.268310;
const test1 = isWithinDeliveryRadius(shopLat, shopLng, ucpLat, ucpLng);
console.log(`Test 1 (UCP Campus): Distance = ${test1.distance} km, Eligible = ${test1.eligible} (Expected: true)`);

// Test Case 2: Point within radius (approx 1.5km away)
const insideLat = 31.439000;
const insideLng = 74.282000;
const test2 = isWithinDeliveryRadius(shopLat, shopLng, insideLat, insideLng);
console.log(`Test 2 (Inside Radius): Distance = ${test2.distance} km, Eligible = ${test2.eligible} (Expected: true)`);

// Test Case 3: Point outside radius (approx 3.2km away)
const outsideLat = 31.460000;
const outsideLng = 74.300000;
const test3 = isWithinDeliveryRadius(shopLat, shopLng, outsideLat, outsideLng);
console.log(`Test 3 (Outside Radius): Distance = ${test3.distance} km, Eligible = ${test3.eligible} (Expected: false)`);

console.log('--- DISTANCE SERVICE TESTS COMPLETE ---');
