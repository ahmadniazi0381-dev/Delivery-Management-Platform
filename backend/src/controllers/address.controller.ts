import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { isWithinDeliveryRadius } from '../services/distance.service';

const DEFAULT_SHOP_LAT = 31.4475531;
const DEFAULT_SHOP_LNG = 74.2690347;
const DEFAULT_MAX_KM = 2.2;

async function getDeliverySettings() {
  const settings = await prisma.deliverySetting.findFirst();
  return {
    shopLat: settings?.shopLatitude  || DEFAULT_SHOP_LAT,
    shopLng: settings?.shopLongitude || DEFAULT_SHOP_LNG,
    maxKm:   settings?.maxDeliveryKm || DEFAULT_MAX_KM,
  };
}

/**
 * Get all saved addresses for the authenticated customer.
 */
export async function getAddresses(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });

    const { shopLat, shopLng, maxKm } = await getDeliverySettings();

    const addressesWithStatus = addresses.map((addr) => {
      const { distance, eligible } = isWithinDeliveryRadius(shopLat, shopLng, addr.latitude, addr.longitude, maxKm);
      return { ...addr, distanceKm: distance, isDeliverable: eligible };
    });

    return res.status(200).json({ success: true, data: addressesWithStatus });
  } catch (error) {
    console.error('Get addresses error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve addresses.' });
  }
}

/**
 * Save a new address. Computes straight-line distance to determine eligibility.
 */
export async function saveAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      label, addressLine, latitude, longitude, isDefault,
      apartment, floor, landmark, deliveryNote,
      placeId, postalCode, city, province, country,
    } = req.body;

    if (!label || !addressLine || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Label, address line, latitude, and longitude are required.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const settings = await prisma.deliverySetting.findFirst();
    const shopLat  = settings?.shopLatitude  || DEFAULT_SHOP_LAT;
    const shopLng  = settings?.shopLongitude || DEFAULT_SHOP_LNG;
    const maxKm    = settings?.maxDeliveryKm || DEFAULT_MAX_KM;
    const { distance, eligible } = isWithinDeliveryRadius(shopLat, shopLng, lat, lng, maxKm);

    // Calculate per-type delivery fees from settings
    const stdEnabled  = settings?.standardEnabled  ?? true;
    const stdFee      = eligible && stdEnabled  ? parseFloat(settings?.standardFee?.toString()  || '50')  : null;
    const stdEta      = eligible && stdEnabled  ? (settings?.standardEta  || '5-20 Minutes')  : null;
    const priEnabled  = settings?.priorityEnabled  ?? true;
    const priFee      = eligible && priEnabled  ? parseFloat(settings?.priorityFee?.toString()  || '125') : null;
    const priEta      = eligible && priEnabled  ? (settings?.priorityEta  || '5-20 Minutes')  : null;
    // Legacy single delivery fee (used in order.controller)
    const baseCharge  = parseFloat(settings?.baseDeliveryCharge?.toString() || '50');
    const perKmCharge = parseFloat(settings?.perKmCharge?.toString() || '20');
    const deliveryFee = eligible ? baseCharge + Math.max(0, distance - 1) * perKmCharge : null;
    const etaMinutes  = eligible ? 30 : null;

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        label,
        addressLine,
        latitude: lat,
        longitude: lng,
        isDefault: isDefault || false,
        apartment:    apartment    || null,
        floor:        floor        || null,
        landmark:     landmark     || null,
        deliveryNote: deliveryNote || null,
        placeId:      placeId      || null,
        postalCode:   postalCode   || null,
        city:         city         || null,
        province:     province     || null,
        country:      country      || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: { ...newAddress, distanceKm: distance, isDeliverable: eligible, deliveryFee, etaMinutes,
        delivery: {
          standard: stdEnabled ? { enabled: true,  fee: stdFee, eta: stdEta } : { enabled: false },
          priority: priEnabled ? { enabled: true,  fee: priFee, eta: priEta } : { enabled: false },
        },
      },
      distanceKm: distance,
      isDeliverable: eligible,
      deliveryFee,
      etaMinutes,
      delivery: {
        standard: stdEnabled ? { enabled: true,  fee: stdFee, eta: stdEta } : { enabled: false },
        priority: priEnabled ? { enabled: true,  fee: priFee, eta: priEta } : { enabled: false },
      },
      message: eligible
        ? 'Address saved. Eligible for delivery.'
        : `Address is outside our ${maxKm}km delivery radius (Distance: ${distance}km).`,
    });
  } catch (error) {
    console.error('Save address error:', error);
    return res.status(500).json({ success: false, error: 'Failed to save address.' });
  }
}

/**
 * Update an existing address.
 */
export async function updateAddress(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    const {
      label, addressLine, latitude, longitude, isDefault,
      apartment, floor, landmark, deliveryNote,
      placeId, postalCode, city, province, country,
    } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const { shopLat, shopLng, maxKm } = await getDeliverySettings();
    const useLat = isNaN(lat) ? existing.latitude  : lat;
    const useLng = isNaN(lng) ? existing.longitude : lng;
    const { distance, eligible } = isWithinDeliveryRadius(shopLat, shopLng, useLat, useLng, maxKm);

    const settings = await prisma.deliverySetting.findFirst();
    const stdEnabled  = settings?.standardEnabled  ?? true;
    const stdFee      = eligible && stdEnabled  ? parseFloat(settings?.standardFee?.toString()  || '50')  : null;
    const stdEta      = eligible && stdEnabled  ? (settings?.standardEta  || '5-20 Minutes')  : null;
    const priEnabled  = settings?.priorityEnabled  ?? true;
    const priFee      = eligible && priEnabled  ? parseFloat(settings?.priorityFee?.toString()  || '125') : null;
    const priEta      = eligible && priEnabled  ? (settings?.priorityEta  || '5-20 Minutes')  : null;

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label:        label        ?? existing.label,
        addressLine:  addressLine  ?? existing.addressLine,
        latitude:     useLat,
        longitude:    useLng,
        isDefault:    isDefault    ?? existing.isDefault,
        apartment:    apartment    !== undefined ? (apartment    || null) : existing.apartment,
        floor:        floor        !== undefined ? (floor        || null) : existing.floor,
        landmark:     landmark     !== undefined ? (landmark     || null) : existing.landmark,
        deliveryNote: deliveryNote !== undefined ? (deliveryNote || null) : existing.deliveryNote,
        placeId:      placeId      !== undefined ? (placeId      || null) : existing.placeId,
        postalCode:   postalCode   !== undefined ? (postalCode   || null) : existing.postalCode,
        city:         city         !== undefined ? (city         || null) : existing.city,
        province:     province     !== undefined ? (province     || null) : existing.province,
        country:      country      !== undefined ? (country      || null) : existing.country,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...updated,
        distanceKm: distance,
        isDeliverable: eligible,
        delivery: {
          standard: stdEnabled ? { enabled: true, fee: stdFee, eta: stdEta } : { enabled: false },
          priority: priEnabled ? { enabled: true, fee: priFee, eta: priEta } : { enabled: false },
        },
      },
      distanceKm: distance,
      isDeliverable: eligible,
    });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update address.' });
  }
}

/**
 * Delete a saved address.
 */
export async function deleteAddress(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    await prisma.address.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Address deleted.' });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete address.' });
  }
}

/**
 * Set an address as the default, clearing any existing default.
 */
export async function setDefaultAddress(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    const updated = await prisma.address.update({ where: { id }, data: { isDefault: true } });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Set default address error:', error);
    return res.status(500).json({ success: false, error: 'Failed to set default address.' });
  }
}

/**
 * Check delivery eligibility for arbitrary coordinates.
 * Returns deliveryFee and etaMinutes so frontend can display without extra round-trips.
 */
export async function checkEligibility(req: AuthenticatedRequest, res: Response) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const settings = await prisma.deliverySetting.findFirst();
    const shopLat  = settings?.shopLatitude  || DEFAULT_SHOP_LAT;
    const shopLng  = settings?.shopLongitude || DEFAULT_SHOP_LNG;
    const maxKm    = settings?.maxDeliveryKm || DEFAULT_MAX_KM;
    const { distance, eligible } = isWithinDeliveryRadius(shopLat, shopLng, lat, lng, maxKm);

    const baseCharge  = parseFloat(settings?.baseDeliveryCharge?.toString() || '50');
    const perKmCharge = parseFloat(settings?.perKmCharge?.toString() || '20');
    const deliveryFee = eligible ? Math.round(baseCharge + Math.max(0, distance - 1) * perKmCharge) : null;
    const etaMinutes  = eligible ? 30 : null;

    // Standard / priority availability from admin settings
    const stdEnabled  = settings?.standardEnabled  ?? true;
    const stdFee      = eligible && stdEnabled  ? parseFloat(settings?.standardFee?.toString()  || '50')  : null;
    const stdEta      = eligible && stdEnabled  ? (settings?.standardEta  || '5-20 Minutes')  : null;
    const priEnabled  = settings?.priorityEnabled  ?? true;
    const priFee      = eligible && priEnabled  ? parseFloat(settings?.priorityFee?.toString()  || '125') : null;
    const priEta      = eligible && priEnabled  ? (settings?.priorityEta  || '5-20 Minutes')  : null;

    return res.status(200).json({
      success: true,
      data: {
        eligible,
        distanceKm: distance,
        maxDeliveryKm: maxKm,
        isDeliverable: eligible,
        deliveryFee,
        etaMinutes,
        delivery: {
          standard: { enabled: eligible && stdEnabled, fee: stdFee, eta: stdEta },
          priority: { enabled: eligible && priEnabled, fee: priFee, eta: priEta },
        },
      },
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    return res.status(500).json({ success: false, error: 'Failed to compute delivery eligibility.' });
  }
}

