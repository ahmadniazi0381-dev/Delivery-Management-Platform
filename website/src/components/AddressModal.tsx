"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/context/GoogleMapsContext";

const SHOP_LAT = 31.4475531;
const SHOP_LNG = 74.2690347;

interface AddressData {
  label: string;
  addressLine: string;
  apartment: string;
  floor: string;
  landmark: string;
  deliveryNote: string;
  latitude: number;
  longitude: number;
  placeId: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  isDeliverable: boolean;
  distanceKm: number;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressData) => Promise<boolean>;
  onCheckingEligibility?: (checking: boolean) => void;
  token: string | null;
}

export default function AddressModal({
  isOpen,
  onClose,
  onSave,
  onCheckingEligibility,
  token,
}: AddressModalProps) {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [addressLine, setAddressLine] = useState("");
  const [apartment, setApartment] = useState("");
  const [floor, setFloor] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [label, setLabel] = useState("Home");

  const [latitude, setLatitude] = useState(SHOP_LAT);
  const [longitude, setLongitude] = useState(SHOP_LNG);
  const [placeId, setPlaceId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");

  const [isDeliverable, setIsDeliverable] = useState<boolean | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);

  // Initialize map & the new Places Autocomplete element
  useEffect(() => {
    if (!isOpen || !isLoaded || !mapRef.current) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    // Reset previous instance references
    mapInstanceRef.current = null;
    markerRef.current = null;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstance,
      draggable: true,
      title: "Delivery Location",
    });

    // Marker drag handler
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      const newLat = pos.lat();
      const newLng = pos.lng();
      setLatitude(newLat);
      setLongitude(newLng);
      setGeocodeFailed(false);
      checkDeliveryRadius(newLat, newLng);
      reverseGeocode(newLat, newLng);
    });

    // Map click handler
    mapInstance.addListener("click", (e: any) => {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      marker.setPosition({ lat: clickedLat, lng: clickedLng });
      setLatitude(clickedLat);
      setLongitude(clickedLng);
      setGeocodeFailed(false);
      checkDeliveryRadius(clickedLat, clickedLng);
      reverseGeocode(clickedLat, clickedLng);
    });

    mapInstanceRef.current = mapInstance;
    markerRef.current = marker;

    // Set up the new Places Autocomplete element programmatically
    const setupNewAutocomplete = async () => {
      try {
        const container = document.getElementById("places-autocomplete-container");
        if (!container) return;
        container.innerHTML = "";

        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any;
        const autocomplete = new PlaceAutocompleteElement({
          componentRestrictions: { country: ["pk"] },
        });

        autocomplete.setAttribute("placeholder", "Search for your society, street, or hostel...");
        autocomplete.addEventListener("gmp-placeselect", async (event: any) => {
          const place = event.place;
          if (!place) return;

          try {
            await place.fetchFields({
              fields: ["displayName", "formattedAddress", "location", "id", "addressComponents"],
            });

            const lat = place.location.lat();
            const lng = place.location.lng();

            setLatitude(lat);
            setLongitude(lng);
            setAddressLine(place.formattedAddress || place.displayName || "");
            setPlaceId(place.id || "");
            setError("");
            setGeocodeFailed(false);

            // Extract components
            extractNewAddressComponents(place.addressComponents);

            // Center map & pin
            mapInstance.setCenter({ lat, lng });
            marker.setPosition({ lat, lng });

            // Check eligibility
            checkDeliveryRadius(lat, lng);
          } catch (err) {
            setError("Could not get location details for this place.");
          }
        });

        container.appendChild(autocomplete);
      } catch (err) {
        setError("Places Autocomplete library failed to load.");
      }
    };

    setupNewAutocomplete();
  }, [isOpen, isLoaded]);

  useEffect(() => {
    if (!isOpen) {
      setGeocodeFailed(false);
    }
  }, [isOpen]);

  const extractNewAddressComponents = (components: any[]) => {
    if (!components) return;
    components.forEach((component: any) => {
      const types = component.types || [];
      if (types.includes("postal_code")) {
        setPostalCode(component.longText || component.shortText || "");
      }
      if (types.includes("locality")) {
        setCity(component.longText || component.shortText || "");
      }
      if (types.includes("administrative_area_level_1")) {
        setProvince(component.longText || component.shortText || "");
      }
      if (types.includes("country")) {
        setCountry(component.longText || component.shortText || "");
      }
    });
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<boolean> => {
    const google = (window as any).google;
    if (!google?.maps) return false;

    const geocoder = new google.maps.Geocoder();
    try {
      const results = await geocoder.geocode({ location: { lat, lng } });
      if (results[0]) {
        setAddressLine(results[0].formatted_address);
        results[0].address_components.forEach((comp: any) => {
          const types = comp.types || [];
          if (types.includes("postal_code")) setPostalCode(comp.short_name);
          if (types.includes("locality")) setCity(comp.long_name);
          if (types.includes("administrative_area_level_1")) setProvince(comp.long_name);
          if (types.includes("country")) setCountry(comp.long_name);
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const checkDeliveryRadius = async (lat: number, lng: number) => {
    if (!token) return;

    setChecking(true);
    onCheckingEligibility?.(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/addresses/check-eligibility`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsDeliverable(data.data.eligible);
        setDistanceKm(data.data.distanceKm);
      } else {
        setIsDeliverable(false);
        setError(data.error || "Could not check delivery eligibility.");
      }
    } catch (err) {
      setIsDeliverable(false);
      setError("Network error checking delivery eligibility.");
    } finally {
      setChecking(false);
      onCheckingEligibility?.(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setChecking(true);
    setGeocodeFailed(false);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
        }

        // Reverse geocode — never expose raw coordinates to customer
        const geocodeSuccess = await reverseGeocode(lat, lng);
        checkDeliveryRadius(lat, lng);

        if (!geocodeSuccess) {
          setAddressLine("");
          setGeocodeFailed(true);
        }

        setChecking(false);
      },
      () => {
        setError("Could not access your location. Please check location permissions.");
        setChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRetryGeocode = () => {
    handleUseCurrentLocation();
  };

  const handleSave = async () => {
    setError("");

    if (geocodeFailed) {
      setError("Unable to determine address. Please use the search bar or retry 'Use Current Location'.");
      return;
    }

    if (!addressLine.trim()) {
      setError("Please select a delivery address.");
      return;
    }

    if (isDeliverable === false) {
      setError("This location is outside our delivery area.");
      return;
    }

    setIsSaving(true);
    const success = await onSave({
      label,
      addressLine,
      apartment,
      floor,
      landmark,
      deliveryNote,
      latitude,
      longitude,
      placeId,
      postalCode,
      city,
      province,
      country,
      isDeliverable: isDeliverable === true,
      distanceKm,
    });

    if (success) {
      // Reset form
      setApartment("");
      setFloor("");
      setLandmark("");
      setDeliveryNote("");
      setLabel("Home");
      onClose();
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fp-modal-backdrop" onClick={onClose}>
      <section
        className="fp-address-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fp-modal-head">
          <div>
            <h2>📍 Delivery Address</h2>
            <p>Search and select your delivery location</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "#FEE2E2", borderRadius: "12px", color: "#B91C1C", fontSize: "14px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {geocodeFailed && (
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: "#FEF3C7",
              borderRadius: "12px",
              marginBottom: "16px",
              borderLeft: "4px solid #D97706",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <strong style={{ color: "#92400E", display: "block" }}>
              Unable to determine address
            </strong>
            <span style={{ color: "#92400E", fontSize: "14px" }}>
              We could not find a readable address for this location. Please try again or use the search bar above.
            </span>
            <button
              onClick={handleRetryGeocode}
              disabled={checking}
              style={{
                alignSelf: "flex-start",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #D97706",
                backgroundColor: "#FFFBEB",
                color: "#D97706",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {checking ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {/* Search address using Places Autocomplete Element (New) */}
        <label className="fp-field">
          <span style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>
            Search Address
          </span>
          <div id="places-autocomplete-container" style={{ width: "100%" }} />
        </label>

        {/* Selected address display */}
        {addressLine && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#F0FDF4",
              borderRadius: "12px",
              marginBottom: "16px",
              borderLeft: "4px solid #22C55E",
            }}
          >
            <strong style={{ color: "#166534", display: "block", marginBottom: "4px" }}>
              Selected Address
            </strong>
            <span style={{ color: "#166534", fontSize: "14px" }}>{addressLine}</span>
          </div>
        )}

        {/* Delivery status */}
        {isDeliverable !== null && (
          <div
            style={{
              padding: "12px",
              backgroundColor: isDeliverable ? "#D1FAE5" : "#FEE2E2",
              borderRadius: "12px",
              marginBottom: "16px",
              borderLeft: `4px solid ${isDeliverable ? "#10B981" : "#DC2626"}`,
            }}
          >
            <strong
              style={{
                color: isDeliverable ? "#065F46" : "#7F1D1D",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {isDeliverable ? "✓ Delivery Available" : "✗ Outside Delivery Area"}
            </strong>
            <span
              style={{
                color: isDeliverable ? "#047857" : "#B91C1C",
                fontSize: "14px",
                display: "block",
              }}
            >
              {distanceKm.toFixed(2)} km away
              {isDeliverable ? " • Order will be prepared and delivered shortly." : " • Please choose another location"}
            </span>
          </div>
        )}

        {/* Map */}
        <div
          style={{
            height: "280px",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "16px",
            border: "1px solid #E5E7EB",
          }}
        >
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Optional details */}
        <div className="fp-two" style={{ marginBottom: "16px" }}>
          <label className="fp-field">
            <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Apartment/Floor (Optional)
            </span>
            <input
              className="fp-input"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="e.g., Apt 5, Floor 3"
            />
          </label>
          <label className="fp-field">
            <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Landmark (Optional)
            </span>
            <input
              className="fp-input"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g., Near mosque"
            />
          </label>
        </div>

        {/* Delivery note */}
        <label className="fp-field" style={{ marginBottom: "16px" }}>
          <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
            Delivery Note (Optional)
          </span>
          <textarea
            className="fp-input"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="e.g., Call before arriving, Ring 3 times"
            style={{ minHeight: "80px" }}
          />
        </label>

        {/* Address labels */}
        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>
            Address Type
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {["Home", "Work", "Hostel", "Other"].map((type) => (
              <button
                key={type}
                onClick={() => setLabel(type)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: label === type ? "2px solid #D97706" : "1px solid #E5E7EB",
                  backgroundColor: label === type ? "#FEF3C7" : "#F9FAFB",
                  cursor: "pointer",
                  fontWeight: label === type ? 600 : 500,
                  fontSize: "14px",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="fp-modal-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            onClick={handleUseCurrentLocation}
            disabled={checking}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              backgroundColor: "#F9FAFB",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {checking ? "Locating..." : "📍 Use Current Location"}
          </button>
          <button
            onClick={handleSave}
            disabled={!addressLine.trim() || isDeliverable === false || isSaving || geocodeFailed}
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor:
                !addressLine.trim() || isDeliverable === false || geocodeFailed ? "#D1D5DB" : "#D97706",
              color: "#FFFFFF",
              border: "none",
              cursor:
                !addressLine.trim() || isDeliverable === false || geocodeFailed ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {isSaving ? "Saving..." : "Confirm Address"}
          </button>
        </div>
      </section>
    </div>
  );
}
