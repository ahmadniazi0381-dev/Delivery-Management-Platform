"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGoogleMaps } from "@/context/GoogleMapsContext";

const SHOP_LAT = 31.4475531;
const SHOP_LNG = 74.2690347;

// Focusable elements selector for focus trap
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(',');

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
  const { isLoaded, error: mapsLoadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<Element | null>(null);

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

  // Store trigger element and handle Escape key + focus trap
  useEffect(() => {
    if (isOpen) {
      // Store the element that triggered the modal
      triggerRef.current = document.activeElement;

      // Focus first focusable element in dialog on open
      const timer = setTimeout(() => {
        const dialog = dialogRef.current;
        if (dialog) {
          const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          firstFocusable?.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Restore focus to trigger element on close
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [isOpen]);

  // Escape key handler + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        const visible = focusable.filter(el => !el.closest('[hidden]'));
        if (visible.length === 0) return;

        const first = visible[0];
        const last = visible[visible.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

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

        const applyPlace = async (place: any) => {
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

            extractNewAddressComponents(place.addressComponents);

            mapInstance.setCenter({ lat, lng });
            marker.setPosition({ lat, lng });

            checkDeliveryRadius(lat, lng);
          } catch {
            setError("Could not get location details for this place.");
          }
        };

        // Current Places API (New) event
        autocomplete.addEventListener("gmp-select", async (event: any) => {
          try {
            const prediction = event.placePrediction;
            if (prediction?.toPlace) {
              const place = prediction.toPlace();
              await applyPlace(place);
              return;
            }
            if (event.place) await applyPlace(event.place);
          } catch {
            setError("Could not select this place.");
          }
        });

        // Legacy fallback for older Places Autocomplete Element builds
        autocomplete.addEventListener("gmp-placeselect", async (event: any) => {
          await applyPlace(event.place);
        });

        container.appendChild(autocomplete);
      } catch {
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
    } catch {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fp-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className="fp-address-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fp-modal-head">
          <div>
            <h2 id="address-modal-title">Delivery Address</h2>
            <p>Search and select your delivery location</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close delivery address dialog"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              fontSize: "1.1rem",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all var(--transition-fast)",
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              padding: "12px 16px",
              backgroundColor: "color-mix(in srgb, var(--error) 10%, var(--bg-card))",
              borderRadius: "var(--radius-md)",
              color: "var(--error)",
              fontSize: "14px",
              marginBottom: "16px",
              border: "1px solid color-mix(in srgb, var(--error) 28%, var(--border-color))",
            }}
          >
            {error}
          </div>
        )}

        {mapsLoadError && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-md)",
              color: "var(--warning)",
              fontSize: "14px",
              marginBottom: "16px",
              border: "1px solid var(--border-color)",
            }}
          >
            {mapsLoadError}
          </div>
        )}

        {!isLoaded && !mapsLoadError && (
          <div
            role="status"
            aria-live="polite"
            style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" }}
          >
            Loading Google Maps…
          </div>
        )}

        {geocodeFailed && (
          <div
            role="alert"
            style={{
              padding: "14px 16px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-md)",
              marginBottom: "16px",
              borderLeft: "4px solid var(--saffron)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <strong style={{ color: "var(--warning)", display: "block" }}>
              Unable to determine address
            </strong>
            <span style={{ color: "var(--warning)", fontSize: "14px" }}>
              We could not find a readable address for this location. Please try again or use the search bar above.
            </span>
            <button
              onClick={handleRetryGeocode}
              disabled={checking}
              style={{
                alignSelf: "flex-start",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--saffron)",
                backgroundColor: "var(--bg-card)",
                color: "var(--saffron-dark)",
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
        <div className="fp-field">
          <label
            htmlFor="places-autocomplete-container"
            style={{ fontWeight: 700, display: "block", marginBottom: "8px", fontSize: "0.875rem" }}
          >
            Search Address
          </label>
          <div id="places-autocomplete-container" style={{ width: "100%" }} />
        </div>

        {/* Selected address display */}
        {addressLine && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px",
              backgroundColor: "color-mix(in srgb, var(--success) 11%, var(--bg-card))",
              borderRadius: "var(--radius-md)",
              marginBottom: "16px",
              borderLeft: "4px solid var(--success)",
            }}
          >
            <strong style={{ color: "var(--success)", display: "block", marginBottom: "4px" }}>
              Selected Address
            </strong>
            <span style={{ color: "var(--success)", fontSize: "14px" }}>{addressLine}</span>
          </div>
        )}

        {/* Delivery status */}
        {isDeliverable !== null && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px",
              backgroundColor: isDeliverable
                ? "color-mix(in srgb, var(--success) 12%, var(--bg-card))"
                : "color-mix(in srgb, var(--error) 12%, var(--bg-card))",
              borderRadius: "var(--radius-md)",
              marginBottom: "16px",
              borderLeft: `4px solid ${isDeliverable ? "var(--success)" : "var(--error)"}`,
            }}
          >
            <strong
              style={{
                color: isDeliverable ? "var(--success)" : "var(--error)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {isDeliverable ? "✓ Delivery Available" : "✗ Outside Delivery Area"}
            </strong>
            <span
              style={{
                color: isDeliverable ? "var(--success)" : "var(--error)",
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
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: "16px",
            border: "1px solid var(--border-color)",
          }}
          aria-label="Delivery location map — drag the marker or click to adjust"
        >
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Optional details */}
        <div className="fp-two" style={{ marginBottom: "16px" }}>
          <div className="fp-field">
            <label
              htmlFor="address-apartment"
              style={{ fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "0.875rem" }}
            >
              Apartment / Floor <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="address-apartment"
              className="fp-input"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="e.g., Apt 5, Floor 3"
              autoComplete="address-line2"
            />
          </div>
          <div className="fp-field">
            <label
              htmlFor="address-landmark"
              style={{ fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "0.875rem" }}
            >
              Landmark <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="address-landmark"
              className="fp-input"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g., Near mosque"
            />
          </div>
        </div>

        {/* Delivery note */}
        <div className="fp-field" style={{ marginBottom: "16px" }}>
          <label
            htmlFor="address-delivery-note"
            style={{ fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "0.875rem" }}
          >
            Delivery Note <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
          </label>
          <textarea
            id="address-delivery-note"
            className="fp-input"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="e.g., Call before arriving, Ring 3 times"
            style={{ minHeight: "80px" }}
          />
        </div>

        {/* Address type buttons */}
        <fieldset style={{ marginBottom: "16px", border: "none", padding: 0, margin: "0 0 16px" }}>
          <legend style={{ fontWeight: 700, display: "block", marginBottom: "10px", fontSize: "0.875rem", color: "var(--text-primary)" }}>
            Address Type
          </legend>
          <div className="fp-address-type-grid">
            {(["Home", "Work", "Hostel", "Other"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLabel(type)}
                aria-pressed={label === type}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: label === type
                    ? "2px solid var(--saffron)"
                    : "1.5px solid var(--border-color)",
                  backgroundColor: label === type
                    ? "color-mix(in srgb, var(--saffron) 12%, var(--bg-card))"
                    : "var(--bg-card)",
                  color: label === type ? "var(--saffron-dark)" : "var(--text-primary)",
                  cursor: "pointer",
                  fontWeight: label === type ? 700 : 500,
                  fontSize: "0.875rem",
                  transition: "all var(--transition-fast)",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={checking}
            style={{
              padding: "13px 16px",
              borderRadius: "var(--radius-md)",
              border: "1.5px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              cursor: checking ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "all var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            aria-busy={checking}
          >
            <span aria-hidden="true">📍</span>
            {checking ? "Locating…" : "Use My Location"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!addressLine.trim() || isDeliverable === false || isSaving || geocodeFailed}
            style={{
              padding: "13px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor:
                !addressLine.trim() || isDeliverable === false || geocodeFailed
                  ? "color-mix(in srgb, var(--text-muted) 30%, var(--bg-card))"
                  : "var(--saffron)",
              color:
                !addressLine.trim() || isDeliverable === false || geocodeFailed
                  ? "var(--text-secondary)"
                  : "#FFFFFF",
              border: "none",
              cursor:
                !addressLine.trim() || isDeliverable === false || geocodeFailed ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 700,
              transition: "all var(--transition-fast)",
            }}
            aria-busy={isSaving}
          >
            {isSaving ? "Saving…" : "Confirm Address"}
          </button>
        </div>
      </section>
    </div>
  );
}
