"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AddressModal from "@/components/AddressModal";
import { paymentRedirectUrl, submitGatewayRedirect } from "@/lib/payment-gateway";

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
  const [checkingEligibility, setCheckingEligibility] = useState(false);

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
  const mapSrc = `https://maps.google.com/maps?q=${mapLat},${mapLng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

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

  const fetchDeliveryOptions = async (lat: number, lng: number) => {
    if (!token) return;
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
      // Silently ignore — use defaults
    }
  };

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

  const canPlaceOrder =
    cart.items.length > 0 &&
    hasDeliveryLocation &&
    enabledPaymentMethods.includes(paymentMethod) &&
    (deliveryType === "STANDARD" ? deliveryOptions.standard.enabled : deliveryOptions.priority.enabled);

  const handlePlaceOrder = async () => {
    if (!API_URL || !token || !canPlaceOrder) return;
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

        {error && <div className="fp-alert error">{error}</div>}
        {success && <div className="fp-alert success">{success}</div>}

        <div className="fp-grid">
          <section className="fp-main">
            {/* Delivery Address */}
            <div className="fp-card">
              <div className="fp-card-title">
                <h2>Delivery address</h2>
                <button onClick={() => setAddressModalOpen(true)}>
                  {selectedAddress ? "Change" : "Add"}
                </button>
              </div>

              <div className="fp-mini-map">
                <iframe title="Delivery location map" src={mapSrc} loading="lazy" />
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
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "8px" }}>
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
                            ? "2px solid #D97706"
                            : "1px solid #E5E7EB",
                        backgroundColor:
                          selectedAddressId === address.id ? "#FEF3C7" : "#FFFFFF",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "2px" }}>
                        {address.label}
                        {address.isDefault ? " • Default" : ""}
                        {address.isDeliverable === false ? " ⚠ Outside area" : ""}
                      </strong>
                      <span style={{ color: "#6B7280", fontSize: "12px" }}>
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
                      border: "1px dashed #D97706",
                      backgroundColor: "#FFFBEB",
                      color: "#D97706",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    + Add new address
                  </button>
                </div>
              )}

              {/* Rider note */}
              {selectedAddress && isEligible === true && (
                <textarea
                  className="fp-input"
                  value={riderNote}
                  onChange={(e) => setRiderNote(e.target.value)}
                  placeholder="Additional note for rider (optional, max 500 chars)"
                  maxLength={500}
                  style={{ minHeight: "70px", marginTop: "12px" }}
                />
              )}
            </div>

            {/* Delivery Type — REQ-DELIVERY-001 / REQ-DELIVERY-002 */}
            {isEligible === true && (
              <div className="fp-card">
                <h2>Delivery type</h2>

                {showDeliveryRadios ? (
                  <div role="radiogroup" aria-label="Delivery type">
                    {deliveryOptions.standard.enabled && (
                      <label className={`fp-option${deliveryType === "STANDARD" ? " selected" : ""}`}>
                        <input
                          type="radio"
                          name="delivery-type"
                          value="STANDARD"
                          checked={deliveryType === "STANDARD"}
                          onChange={() => setDeliveryType("STANDARD")}
                        />
                        <div>
                          <strong>Standard Delivery</strong>
                          <span style={{ display: "block", fontSize: "13px", color: "#6B7280" }}>
                            {deliveryOptions.standard.eta ?? "5-20 Minutes"}
                          </span>
                        </div>
                        <em style={{ marginLeft: "auto", color: "#059669", fontWeight: 600 }}>
                          {deliveryOptions.standard.fee === 0 ? "Free" : `+Rs. ${deliveryOptions.standard.fee}`}
                        </em>
                      </label>
                    )}
                    {deliveryOptions.priority.enabled && (
                      <label className={`fp-option${deliveryType === "PRIORITY" ? " selected" : ""}`}>
                        <input
                          type="radio"
                          name="delivery-type"
                          value="PRIORITY"
                          checked={deliveryType === "PRIORITY"}
                          onChange={() => setDeliveryType("PRIORITY")}
                        />
                        <div>
                          <strong>Priority Delivery</strong>
                          <span style={{ display: "block", fontSize: "13px", color: "#6B7280" }}>
                            {deliveryOptions.priority.eta ?? "5-20 Minutes"}
                          </span>
                        </div>
                        <em style={{ marginLeft: "auto", color: "#D97706", fontWeight: 600 }}>
                          +Rs. {deliveryOptions.priority.fee ?? 125}
                        </em>
                      </label>
                    )}
                  </div>
                ) : (
                  /* Only one option — display as info, no radio needed */
                  <div style={{ padding: "14px 16px", backgroundColor: "#F0FDF4", borderRadius: "12px", borderLeft: "4px solid #22C55E" }}>
                    <strong style={{ color: "#166534" }}>
                      {deliveryType === "PRIORITY" ? "Priority Delivery" : "Standard Delivery"}
                    </strong>
                    <span style={{ display: "block", color: "#166534", fontSize: "13px", marginTop: "2px" }}>
                      {estimatedEta} · Rs. {deliveryFee}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recipient (optional) */}
            <div className="fp-card">
              <h2>Recipient details <span style={{ color: "#9CA3AF", fontSize: "14px", fontWeight: 400 }}>(optional)</span></h2>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
                Leave blank if you are ordering for yourself.
              </p>
              <div className="fp-two">
                <input
                  className="fp-input"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient name"
                />
                <input
                  className="fp-input"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Recipient phone"
                />
              </div>
            </div>

            {/* Payment — only shows enabled methods (REQ-PAYMENT-003) */}
            <div className="fp-card">
              <h2>Payment</h2>
              {([
                ["COD", "Cash on Delivery"],
                ["CARD", "Credit or Debit Card"],
                ["JAZZCASH", "JazzCash"],
                ["EASYPAISA", "easypaisa"],
              ] as [PaymentMethod, string][]).filter(([key]) => enabledPaymentMethods.includes(key)).map(([key, label]) => (
                <label className={`fp-payment ${paymentMethod === key ? "selected" : ""}`} key={key}>
                  <input type="radio" checked={paymentMethod === key} onChange={() => setPaymentMethod(key)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <aside className="fp-summary">
            <div className="fp-card">
              <h2>Your order from</h2>
              <p>Karachi Naseeb Biryani &amp; Murgh Pulao - UCP Branch</p>
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
                  <div style={{ color: "#6B7280", fontSize: "13px" }}>
                    <span>Estimated ETA</span><b>{estimatedEta}</b>
                  </div>
                )}
                <div className="total"><span>Total</span><b>Rs. {total.toFixed(0)}</b></div>
              </div>

              {!hasDeliveryLocation && (
                <div style={{ padding: "10px", backgroundColor: "#FEF3C7", borderRadius: "8px", fontSize: "13px", color: "#92400E", marginBottom: "12px" }}>
                  Please select a delivery address to place your order.
                </div>
              )}

              <button
                className="fp-place"
                disabled={!canPlaceOrder || isSubmitting}
                onClick={handlePlaceOrder}
              >
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
