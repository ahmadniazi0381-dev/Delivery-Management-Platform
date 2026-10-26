"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AddressModal from "@/components/AddressModal";
import { paymentRedirectUrl, submitGatewayRedirect } from "@/lib/payment-gateway";
import { buildStaticMapUrl, getGoogleMapsApiKey } from "@/context/GoogleMapsContext";

type PaymentMethod = "COD" | "JAZZCASH" | "EASYPAISA" | "CARD";
type DeliveryType = "STANDARD" | "PRIORITY";

interface Address {
  id: string;
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  distanceKm?: number;
  isDeliverable?: boolean;
  apartment?: string;
  floor?: string;
  landmark?: string;
  deliveryNote?: string;
  placeId?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
}

interface DeliveryOption {
  enabled: boolean;
  fee: number | null;
  eta: string | null;
}

interface DeliveryOptions {
  standard: DeliveryOption;
  priority: DeliveryOption;
}

interface ApiIssue {
  field?: string;
  message?: string;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  issues?: ApiIssue[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SHOP_LAT = 31.4475531;
const SHOP_LNG = 74.2690347;

function formatApiError(data: ApiErrorBody | null | undefined, fallback: string) {
  if (data?.issues?.length) {
    return data.issues.map((issue) => `${issue.field || "field"}: ${issue.message || "Invalid value"}`).join(" ");
  }
  return data?.error || data?.message || fallback;
}

export default function CheckoutPage() {
  const { user, token, isLoading } = useAuth();
  const { cart, clearCart, increment, decrement } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Delivery options from backend settings (fetched on address select)
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    standard: { enabled: true, fee: 50, eta: "5-20 Minutes" },
    priority: { enabled: true, fee: 125, eta: "5-20 Minutes" },
  });
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("STANDARD");

  // Recipient details
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [riderNote, setRiderNote] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<PaymentMethod[]>(["COD", "CARD", "JAZZCASH", "EASYPAISA"]);

  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [distanceInfo, setDistanceInfo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setCheckingEligibility] = useState(false);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  // Delivery fee based on selected type
  const deliveryFee = useMemo(() => {
    if (isEligible !== true) return 0;
    if (deliveryType === "PRIORITY") return deliveryOptions.priority.fee ?? 125;
    return deliveryOptions.standard.fee ?? 50;
  }, [deliveryType, deliveryOptions, isEligible]);

  const estimatedEta = useMemo(() => {
    if (isEligible !== true) return null;
    if (deliveryType === "PRIORITY") return deliveryOptions.priority.eta;
    return deliveryOptions.standard.eta;
  }, [deliveryType, deliveryOptions, isEligible]);

  const total = cart.subtotal + deliveryFee;

  const mapLat = selectedAddress?.latitude ?? SHOP_LAT;
  const mapLng = selectedAddress?.longitude ?? SHOP_LNG;
  const mapsKey = getGoogleMapsApiKey();
  const staticMapSrc = mapsKey ? buildStaticMapUrl(mapLat, mapLng, mapsKey) : null;

  // How many delivery options are active
  const activeDeliveryCount = [deliveryOptions.standard.enabled, deliveryOptions.priority.enabled].filter(Boolean).length;
  const showDeliveryRadios = isEligible === true && activeDeliveryCount > 1;

  // Auto-select when only one is active
  useEffect(() => {
    if (isEligible !== true) return;
    if (!deliveryOptions.standard.enabled && deliveryOptions.priority.enabled) {
      setDeliveryType("PRIORITY");
    } else if (deliveryOptions.standard.enabled && !deliveryOptions.priority.enabled) {
      setDeliveryType("STANDARD");
    }
  }, [deliveryOptions, isEligible]);

  const fetchDeliveryOptions = useCallback(async (lat: number, lng: number) => {
    if (!API_URL || !token) return;
    try {
      const res = await fetch(`${API_URL}/addresses/check-eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success && data.data?.delivery) {
        setDeliveryOptions(data.data.delivery);
      }
    } catch {
      // Keep checkout usable with default delivery options if this call fails.
    }
  }, [token]);

  const fetchAddresses = useCallback(async () => {
    if (!API_URL || !token) return;
    try {
      const res = await fetch(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAddresses(data.data);
        const defaultAddress = data.data.find((a: Address) => a.isDefault) || data.data[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setIsEligible(defaultAddress.isDeliverable !== false);
          setDistanceInfo(`${Number(defaultAddress.distanceKm || 0).toFixed(2)} km`);
          // Fetch delivery options for default address
          if (defaultAddress.isDeliverable) {
            await fetchDeliveryOptions(defaultAddress.latitude, defaultAddress.longitude);
          }
        } else {
          setAddressModalOpen(true);
        }
      }
    } catch {
      setError("Could not load saved addresses.");
    }
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) router.push("/auth/login?redirect=/checkout");
  }, [isLoading, router, token]);

  useEffect(() => {
    if (!token || !API_URL) return;
    const recoverCheckout = async () => {
      try {
        const res = await fetch(`${API_URL}/checkout/recovery`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) return;
        const recovery = data.data;
        if (recovery.state === "COMPLETED" && recovery.order?.id) {
          setSuccess("Your previous payment completed. Opening your order.");
          clearCart();
          router.push(`/track?orderId=${recovery.order.id}`);
        } else if (recovery.state === "PENDING") {
          setSuccess("You have a pending payment session. Submit checkout again to resume payment.");
        } else if (recovery.state === "CART_RESTORED") {
          setSuccess(recovery.message || "Your cart has been restored.");
        }
      } catch {
        // ignore recovery errors on checkout page load
      }
    };
    recoverCheckout();
  }, [token, router, clearCart]);

  useEffect(() => {
    if (!isLoading && token && cart.items.length === 0 && !success) {
      router.push("/menu");
    }
  }, [cart.items.length, isLoading, router, token, success]);

  // Fetch enabled payment methods from backend (REQ-PAYMENT-003)
  const fetchEnabledPaymentMethods = useCallback(async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/payments/methods`);
      const data = await res.json();
      if (data.success && data.data) {
        const enabled = data.data
          .filter((m: any) => m.enabled)
          .map((m: any) => m.method as PaymentMethod);
        if (enabled.length > 0) {
          setEnabledPaymentMethods(enabled);
          // Default to first enabled method
          setPaymentMethod((current) => (enabled.includes(current) ? current : enabled[0]));
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchAddresses();
    fetchEnabledPaymentMethods();
  }, [fetchAddresses, fetchEnabledPaymentMethods, token]);

  const handleSaveAddress = async (addressData: any) => {
    if (!API_URL || !token) return false;

    try {
      const payload = {
        label: addressData.label,
        addressLine: addressData.addressLine,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        apartment: addressData.apartment || "",
        floor: addressData.floor || "",
        landmark: addressData.landmark || "",
        deliveryNote: addressData.deliveryNote || "",
        placeId: addressData.placeId || "",
        postalCode: addressData.postalCode || "",
        city: addressData.city || "",
        province: addressData.province || "",
        country: addressData.country || "",
        isDefault: addresses.length === 0,
      };

      const res = await fetch(`${API_URL}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(formatApiError(data, "Could not save address."));
        return false;
      }

      await fetchAddresses();
      setSelectedAddressId(data.data.id);
      setIsEligible(data.data.isDeliverable);
      setDistanceInfo(`${Number(data.data.distanceKm || 0).toFixed(2)} km`);

      // Apply delivery options if returned by the save endpoint
      if (data.data.isDeliverable && data.delivery) {
        setDeliveryOptions(data.delivery);
      } else if (data.data.isDeliverable) {
        await fetchDeliveryOptions(addressData.latitude, addressData.longitude);
      }
      return true;
    } catch {
      setError("Network error while saving address.");
      return false;
    }
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!API_URL || !token) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`${API_URL}/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAddresses(addresses.filter((a) => a.id !== id));
        if (selectedAddressId === id) {
          setSelectedAddressId("");
          setIsEligible(null);
        }
      }
    } catch {
      setError("Failed to delete address.");
    }
  };

  const selectSavedAddress = async (address: Address) => {
    setSelectedAddressId(address.id);
    setIsEligible(address.isDeliverable ?? true);
    setDistanceInfo(`${Number(address.distanceKm || 0).toFixed(2)} km`);
    if (address.isDeliverable) {
      await fetchDeliveryOptions(address.latitude, address.longitude);
    }
  };

  const hasDeliveryLocation = selectedAddressId && isEligible === true;

  const phoneReady = !!(user?.phone && (user.phoneVerified || user.isPhoneVerified));

  const canPlaceOrder =
    cart.items.length > 0 &&
    hasDeliveryLocation &&
    phoneReady &&
    enabledPaymentMethods.includes(paymentMethod) &&
    (deliveryType === "STANDARD" ? deliveryOptions.standard.enabled : deliveryOptions.priority.enabled);

  const handlePlaceOrder = async () => {
    if (!API_URL || !token || !canPlaceOrder) return;
    if (!phoneReady) {
      setError("Add and verify your phone number in Profile before placing an order.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const orderBody = {
        paymentMethod,
        deliveryType,
        addressId: selectedAddressId,
        specialInstructions: riderNote.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientPhone: recipientPhone.trim() || undefined,
        items: cart.items.map((item) => ({
          menuItemId: String(item.menuItem.id),
          quantity: item.quantity,
        })),
      };

      const checkoutRes = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderBody),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || checkoutData?.success === false) {
        throw new Error(formatApiError(checkoutData, "Failed to place order."));
      }

      const result = checkoutData.data;
      if (result?.flow === "ONLINE") {
        sessionStorage.setItem("pendingCheckoutSessionId", result.checkoutSessionId);
        if (result.gatewayRedirect) {
          submitGatewayRedirect(result.gatewayRedirect);
          return;
        }
        if (result.checkoutSessionId && API_URL) {
          window.location.href = paymentRedirectUrl(API_URL, result.checkoutSessionId);
          return;
        }
        throw new Error("Online payment redirect was not returned by the server.");
      }

      const orderId = result?.order?.id;
      if (!orderId) throw new Error("Order response did not include an order id.");
      setSuccess("Order placed. Redirecting to tracking.");
      clearCart();
      router.push(`/track?orderId=${orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !token || cart.items.length === 0) {
    return (
      <main className="fp-checkout-page">
        <div className="fp-checkout-wrap">
          <div className="fp-card fp-skeleton-block" />
        </div>
      </main>
    );
  }

  return (
    <main className="fp-checkout-page">
      <div className="fp-checkout-wrap">
        <div className="fp-topbar">
          <Link href="/cart">Back to cart</Link>
        </div>

        <h1>Review and place your order</h1>

        {error && <div className="fp-alert error" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "#991B1B", minHeight: "44px", marginBottom: "16px" }}>{error}</div>}
        {success && <div className="fp-alert success" style={{ background: "#ECFDF5", border: "1px solid #15803D20", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "#15803D", marginBottom: "16px" }}>{success}</div>}

        {(!user?.phone || !(user.phoneVerified || user.isPhoneVerified)) && (
          <div className="fp-alert error" role="alert" style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "#991B1B", minHeight: "44px", marginBottom: "16px" }}>
            Add and verify your phone number before placing an order.{" "}
            <Link href="/profile" style={{ textDecoration: "underline", fontWeight: 700, color: "#991B1B" }}>
              Go to Profile
            </Link>
          </div>
        )}

        <div className="fp-grid">
          <section className="fp-main">
            {/* Delivery Address */}
            <div className="fp-card">
              <div className="fp-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>Delivery address</h2>
                <button onClick={() => setAddressModalOpen(true)} style={{ background: "transparent", color: "#EA580C", border: "1px solid #EA580C", borderRadius: "var(--radius-md)", padding: "4px 12px", fontWeight: 600, cursor: "pointer", transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#EA580C"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#EA580C"; }}>
                  {selectedAddress ? "Change" : "Add"}
                </button>
              </div>

              <div className="fp-mini-map">
                {staticMapSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staticMapSrc}
                    alt="Delivery location map preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-secondary, #f5f5f5)",
                      color: "var(--text-secondary, #555)",
                      fontSize: "0.9rem",
                      padding: 16,
                      textAlign: "center",
                    }}
                  >
                    Map preview unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_KEY (enable Maps Static API).
                  </div>
                )}
              </div>

              <div className="fp-address-line">
                <strong>
                  {selectedAddress?.addressLine || "Add your delivery address"}
                </strong>
                <span>
                  {isEligible === true
                    ? `✓ Delivery available · ${distanceInfo}`
                    : isEligible === false
                    ? "✗ Outside delivery area — please choose another address"
                    : "Add address to check delivery availability"}
                </span>
              </div>

              {selectedAddress && (
                <>
                  {selectedAddress.apartment && (
                    <div className="fp-detail">
                      <span>Apartment:</span> {selectedAddress.apartment}
                    </div>
                  )}
                  {selectedAddress.floor && (
                    <div className="fp-detail">
                      <span>Floor:</span> {selectedAddress.floor}
                    </div>
                  )}
                  {selectedAddress.landmark && (
                    <div className="fp-detail">
                      <span>Landmark:</span> {selectedAddress.landmark}
                    </div>
                  )}
                </>
              )}

              {addresses.length > 0 && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                    Your saved addresses
                  </span>
                  {addresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => selectSavedAddress(address)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        marginBottom: "8px",
                        borderRadius: "8px",
                        border:
                          selectedAddressId === address.id
                            ? "2px solid #EA580C"
                            : "1px solid var(--border-color)",
                        backgroundColor:
                          selectedAddressId === address.id ? "rgba(234,88,12,0.04)" : "var(--bg-card)",
                        color:
                          selectedAddressId === address.id ? "#C2410C" : "var(--text-primary)",
                        transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "2px" }}>
                        {address.label}
                        {address.isDefault ? " • Default" : ""}
                        {address.isDeliverable === false ? " ⚠ Outside area" : ""}
                      </strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                        {address.addressLine}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px dashed #EA580C",
                      backgroundColor: "transparent",
                      color: "#EA580C",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(234,88,12,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    + Add new address
                  </button>
                </div>
              )}

              {/* Rider note */}
              {selectedAddress && isEligible === true && (
                <div style={{ marginTop: "12px" }}>
                  <label htmlFor="checkout-rider-note" style={{ display: "block", fontSize: "12px", fontWeight: 650, color: "var(--text-secondary)", marginBottom: "6px" }}>Note for Rider (Optional)</label>
                  <textarea
                    id="checkout-rider-note"
                    className="fp-input"
                    value={riderNote}
                    onChange={(e) => setRiderNote(e.target.value)}
                    placeholder="e.g. Call on arrival, Leave at gate, Ring 3 times"
                    maxLength={500}
                    style={{ minHeight: "70px" }}
                    aria-describedby="rider-note-hint"
                  />
                  <p id="rider-note-hint" style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{riderNote.length}/500 characters</p>
                </div>
              )}
            </div>

            {/* Delivery Type — REQ-DELIVERY-001 / REQ-DELIVERY-002 */}
            {isEligible === true && (
              <div className="fp-card" style={{ marginTop: "24px" }}>
                <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "16px" }}>Delivery type</h2>

                {showDeliveryRadios ? (
                  <div role="radiogroup" aria-label="Delivery type" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {deliveryOptions.standard.enabled && (
                      <label className={`fp-option${deliveryType === "STANDARD" ? " selected" : ""}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "var(--radius-md)", border: deliveryType === "STANDARD" ? "2px solid #EA580C" : "1px solid var(--border-color)", backgroundColor: deliveryType === "STANDARD" ? "rgba(234,88,12,0.04)" : "var(--bg-card)", cursor: "pointer", transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: deliveryType === "STANDARD" ? "0 0 0 4px rgba(234,88,12,0.1)" : "none" }}>
                        <input
                          type="radio"
                          name="delivery-type"
                          value="STANDARD"
                          checked={deliveryType === "STANDARD"}
                          onChange={() => setDeliveryType("STANDARD")}
                          style={{ accentColor: "#EA580C", width: "18px", height: "18px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: "var(--text-primary)" }}>Standard Delivery</strong>
                          <span style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {deliveryOptions.standard.eta ?? "5-20 Minutes"}
                          </span>
                        </div>
                        <em style={{ marginLeft: "auto", color: "#15803D", fontWeight: 700, fontStyle: "normal" }}>
                          {deliveryOptions.standard.fee === 0 ? "Free" : `+Rs. ${deliveryOptions.standard.fee}`}
                        </em>
                      </label>
                    )}
                    {deliveryOptions.priority.enabled && (
                      <label className={`fp-option${deliveryType === "PRIORITY" ? " selected" : ""}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "var(--radius-md)", border: deliveryType === "PRIORITY" ? "2px solid #EA580C" : "1px solid var(--border-color)", backgroundColor: deliveryType === "PRIORITY" ? "rgba(234,88,12,0.04)" : "var(--bg-card)", cursor: "pointer", transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: deliveryType === "PRIORITY" ? "0 0 0 4px rgba(234,88,12,0.1)" : "none" }}>
                        <input
                          type="radio"
                          name="delivery-type"
                          value="PRIORITY"
                          checked={deliveryType === "PRIORITY"}
                          onChange={() => setDeliveryType("PRIORITY")}
                          style={{ accentColor: "#EA580C", width: "18px", height: "18px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: "var(--text-primary)" }}>Priority Delivery</strong>
                          <span style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {deliveryOptions.priority.eta ?? "5-20 Minutes"}
                          </span>
                        </div>
                        <em style={{ marginLeft: "auto", color: "#C2410C", fontWeight: 700, fontStyle: "normal" }}>
                          +Rs. {deliveryOptions.priority.fee ?? 125}
                        </em>
                      </label>
                    )}
                  </div>
                ) : (
                  /* Only one option — display as info, no radio needed */
                  <div style={{ padding: "14px 16px", backgroundColor: "color-mix(in srgb, var(--success) 11%, var(--bg-card))", borderRadius: "12px", borderLeft: "4px solid var(--success)" }}>
                    <strong style={{ color: "var(--success)" }}>
                      {deliveryType === "PRIORITY" ? "Priority Delivery" : "Standard Delivery"}
                    </strong>
                    <span style={{ display: "block", color: "var(--success)", fontSize: "13px", marginTop: "2px" }}>
                      {estimatedEta} · Rs. {deliveryFee}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recipient (optional) */}
            <div className="fp-card" style={{ marginTop: "24px" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "4px" }}>Recipient details <span style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: 400 }}>(optional)</span></h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Leave blank if you are ordering for yourself.
              </p>
              <div className="fp-two">
                <div>
                  <label htmlFor="checkout-recipient-name" style={{ display: "block", fontSize: "12px", fontWeight: 650, color: "var(--text-secondary)", marginBottom: "6px" }}>Recipient Name</label>
                  <input
                    id="checkout-recipient-name"
                    className="fp-input"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-recipient-phone" style={{ display: "block", fontSize: "12px", fontWeight: 650, color: "var(--text-secondary)", marginBottom: "6px" }}>Recipient Phone</label>
                  <input
                    id="checkout-recipient-phone"
                    className="fp-input"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Recipient phone"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Payment — only shows enabled methods (REQ-PAYMENT-003) */}
            <div className="fp-card" style={{ marginTop: "24px" }}>
              <h2 id="payment-methods-heading" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "16px" }}>Payment Method</h2>
              <div role="radiogroup" aria-labelledby="payment-methods-heading" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {([
                  ["COD", "Cash on Delivery", "💵"],
                  ["CARD", "Credit or Debit Card", "💳"],
                  ["JAZZCASH", "JazzCash", "📱"],
                  ["EASYPAISA", "easypaisa", "📱"],
                ] as [PaymentMethod, string, string][]).filter(([key]) => enabledPaymentMethods.includes(key)).map(([key, payLabel, icon]) => (
                  <label className={`fp-payment ${paymentMethod === key ? "selected" : ""}`} key={key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "var(--radius-md)", border: paymentMethod === key ? "2px solid #EA580C" : "1px solid var(--border-color)", backgroundColor: paymentMethod === key ? "rgba(234,88,12,0.04)" : "var(--bg-card)", cursor: "pointer", transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: paymentMethod === key ? "0 0 0 4px rgba(234,88,12,0.1)" : "none" }}>
                    <input
                      type="radio"
                      name="payment-method"
                      value={key}
                      checked={paymentMethod === key}
                      onChange={() => setPaymentMethod(key)}
                      aria-label={payLabel}
                      style={{ accentColor: "#EA580C", width: "18px", height: "18px" }}
                    />
                    <span className="text-2xl" style={{ fontSize: "1.5rem" }}>{icon}</span>
                    <span style={{ fontWeight: paymentMethod === key ? 700 : 500, color: paymentMethod === key ? "#C2410C" : "var(--text-primary)" }}>{payLabel}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <aside className="fp-summary" style={{ position: "sticky", top: "24px" }}>
            <div className="fp-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-md)", padding: "24px" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "4px" }}>Your order from</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>Delivery Platform</p>
              <div className="fp-items">
                {cart.items.map((item) => (
                  <div className="fp-item" key={String(item.menuItem.id)}>
                    <div className="fp-thumb">
                      {item.menuItem.imageUrl ? (
                        <img src={item.menuItem.imageUrl} alt={item.menuItem.name} />
                      ) : (
                        item.menuItem.name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <strong>{item.menuItem.name}</strong>
                      <span>Rs. {item.menuItem.price.toFixed(0)}</span>
                    </div>
                    <div className="fp-qty">
                      <button onClick={() => decrement(item.menuItem.id)}>-</button>
                      <b>{item.quantity}</b>
                      <button onClick={() => increment(item.menuItem.id)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/menu" className="fp-add-more">+ Add more items</Link>

              <div className="fp-costs">
                <div><span>Subtotal</span><b>Rs. {cart.subtotal.toFixed(0)}</b></div>
                <div>
                  <span>{deliveryType === "PRIORITY" ? "Priority delivery" : "Standard delivery"}</span>
                  <b>{deliveryFee === 0 ? "Free" : `Rs. ${deliveryFee.toFixed(0)}`}</b>
                </div>
                {estimatedEta && (
                  <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    <span>Estimated ETA</span><b>{estimatedEta}</b>
                  </div>
                )}
                <div className="total"><span>Total</span><b>Rs. {total.toFixed(0)}</b></div>
              </div>

              {!hasDeliveryLocation && (
                <div style={{ padding: "10px", backgroundColor: "var(--surface)", borderRadius: "8px", fontSize: "13px", color: "var(--warning)", marginBottom: "12px" }}>
                  Please select a delivery address to place your order.
                </div>
              )}

              <button
                className="fp-place"
                disabled={!canPlaceOrder || isSubmitting}
                onClick={handlePlaceOrder}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  padding: "16px",
                  background: !canPlaceOrder ? "var(--bg-secondary)" : "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                  color: !canPlaceOrder ? "var(--text-muted)" : "#fff",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  cursor: !canPlaceOrder || isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: !canPlaceOrder ? "none" : "0 4px 20px rgba(194,65,12,0.35)",
                  transition: "all var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => { if (canPlaceOrder && !isSubmitting) e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { if (canPlaceOrder && !isSubmitting) e.currentTarget.style.transform = "scale(1)"; }}
              >
                {isSubmitting ? <span style={{ display: "inline-block", width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : null}
                {isSubmitting ? "Placing order…" : `Place order · Rs. ${total.toFixed(0)}`}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSave={handleSaveAddress}
        onCheckingEligibility={setCheckingEligibility}
        token={token}
      />
    </main>
  );
}
