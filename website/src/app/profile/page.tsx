"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Address {
  id: string;
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
}

export default function ProfilePage() {
  const { user, token, logout, setUser, applySession } = useAuth();
  const router = useRouter();

  // Edit info states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Phone add / verify (for Google users without phone)
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"idle" | "otp">("idle");
  const [phoneLoading, setPhoneLoading] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizePhone = (raw: string): string => {
    let c = raw.replace(/[^\d+]/g, "");
    if (c.startsWith("0092")) c = "+" + c.slice(4);
    if (c.startsWith("92") && c.length === 12) c = "+" + c;
    if (c.startsWith("03") && c.length === 11) c = "+92" + c.slice(1);
    if (c.startsWith("3") && c.length === 10) c = "+92" + c;
    return c;
  };

  const handleRequestPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const normalized = normalizePhone(phoneInput);
    if (!normalized || normalized.length < 11) {
      setError("Enter a valid Pakistan mobile number.");
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/phone/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
        return;
      }
      setPhoneInput(normalized);
      setPhoneStep("otp");
      setSuccess("OTP sent. Enter the code to verify your phone.");
    } catch {
      setError("Network error while sending OTP.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleConfirmPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!phoneOtp || phoneOtp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/phone/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phoneInput, code: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to verify phone.");
        return;
      }
      if (data.token && data.user) {
        applySession(data.token, { ...data.user, phoneVerified: true, isPhoneVerified: true });
      } else if (data.user) {
        setUser({ ...data.user, phoneVerified: true, isPhoneVerified: true });
      }
      setPhoneStep("idle");
      setPhoneOtp("");
      setSuccess("Phone number verified successfully.");
    } catch {
      setError("Network error while verifying phone.");
    } finally {
      setPhoneLoading(false);
    }
  };

  useEffect(() => {
    if (user === undefined) {
      return; // Still loading auth context
    }
    
    if (!token || !user) {
      router.push("/auth/login");
      return;
    }

    setName(user.name || "");
    setEmail(user.email || "");
    fetchAddresses();
    setIsInitializing(false);
  }, [token, user, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAddresses(data.data);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name) { setError("Name is required."); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setSuccess("Profile updated successfully!");
      } else {
        setUser({ ...user!, name, email });
        setSuccess("Profile updated locally.");
      }
    } catch {
      setUser({ ...user!, name, email });
      setSuccess("Profile updated locally (offline).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setError(""); setSuccess("");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(addresses.filter((a) => a.id !== id));
      setSuccess("Address removed.");
    } catch {
      setAddresses(addresses.filter((a) => a.id !== id));
      setSuccess("Address removed.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (data.token) {
          applySession(data.token, { ...user, mustChangePassword: false } as any);
        }
      } else {
        setError(data.error || "Failed to change password.");
      }
    } catch {
      setError("Password update failed. Feature not supported offline.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing || !user) {
    return (
      <div style={{ background: "var(--bg-primary, #0C0705)", minHeight: "92vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="skeleton" style={{ height: "140px", borderRadius: "24px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="skeleton" style={{ height: "400px", borderRadius: "24px" }} />
            <div className="skeleton" style={{ height: "400px", borderRadius: "24px" }} />
          </div>
        </div>
        <style jsx>{`
          .skeleton {
            background: linear-gradient(90deg, #1A0E08 0%, #26140C 50%, #1A0E08 100%);
            background-size: 200% 100%;
            animation: skeletonLoading 1.5s infinite;
          }
          @keyframes skeletonLoading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (user.mustChangePassword) {
    return (
      <div style={{ background: "var(--bg-primary, #0C0705)", minHeight: "92vh", padding: "40px 20px", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%" }}>
          <div style={{ background: "rgba(234, 88, 12, 0.1)", border: "1px solid rgba(234, 88, 12, 0.2)", color: "var(--saffron, #EA580C)", padding: "16px", borderRadius: "var(--radius-md, 12px)", marginBottom: "24px", textAlign: "center" }}>
            🔒 <strong style={{ color: "#FFF9F3" }}>Security Update Required</strong>
            <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "var(--text-secondary, #A89B95)" }}>
              Your password has been reset by an administrator. You must update your password before you can use the platform.
            </p>
          </div>

          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", color: "#EF4444", padding: "12px", borderRadius: "var(--radius-md, 12px)", marginBottom: "20px", fontSize: "0.9rem" }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(21, 128, 61, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)", color: "#4ADE80", padding: "12px", borderRadius: "var(--radius-md, 12px)", marginBottom: "20px", fontSize: "0.9rem" }}>
              🎉 {success}
            </div>
          )}

          <div style={{ background: "var(--bg-card, #120A06)", borderRadius: "var(--radius-xl, 24px)", border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", padding: "32px", boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", paddingBottom: "12px", textAlign: "center", color: "#FFF9F3" }}>
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="password"
                className="premium-input"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="premium-input"
                placeholder="New Password (min. 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="premium-input"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={isLoading} className="btn-premium" style={{ width: "100%", marginTop: "8px" }}>
                {isLoading ? "Updating..." : "Update Password & Continue"}
              </button>
            </form>
          </div>
        </div>
        <style jsx>{`
          .premium-input {
            background: var(--bg-input, #1A0E08);
            border: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
            color: var(--text-primary, #FFF9F3);
            border-radius: var(--radius-md, 12px);
            padding: 14px 16px;
            font-size: 1rem;
            outline: none;
            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .premium-input:focus {
            border-color: var(--saffron, #EA580C);
            box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
          }
          .btn-premium {
            background: linear-gradient(135deg, var(--primary, #C2410C) 0%, #EA580C 100%);
            color: #FFFFFF;
            border-radius: var(--radius-lg, 18px);
            border: none;
            font-weight: 700;
            padding: 16px;
            font-size: 1rem;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(234, 88, 12, 0.3);
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .btn-premium:hover:not(:disabled) {
            transform: translateY(-2px);
          }
          .btn-premium:active:not(:disabled) {
            transform: translateY(0);
          }
          .btn-premium:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div style={{ background: "var(--bg-primary, #0C0705)", minHeight: "92vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Profile Header */}
        <div style={{ background: "var(--bg-card, #120A06)", borderRadius: "var(--radius-xl, 24px)", border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", padding: "32px", boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))", display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C2410C 0%, #EA580C 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)",
            flexShrink: 0
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-poppins), sans-serif", fontSize: "1.8rem", fontWeight: 800, margin: 0, color: "var(--text-primary, #FFF9F3)" }}>
              {user.name}
            </h1>
            <p style={{ color: "var(--text-secondary, #A89B95)", fontSize: "0.95rem", margin: "6px 0 0" }}>
              {user.phone
                ? `📞 ${user.phone}${(user.isPhoneVerified || user.phoneVerified) ? " ✅ Verified" : " · Not verified"}`
                : "📞 No phone on file — add one before ordering"}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", color: "#EF4444", padding: "12px 16px", borderRadius: "var(--radius-md, 12px)", marginBottom: "24px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(21, 128, 61, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)", color: "#4ADE80", padding: "12px 16px", borderRadius: "var(--radius-md, 12px)", marginBottom: "24px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
            🎉 {success}
          </div>
        )}

        {/* Phone add / verify */}
        {(!user.phone || !(user.isPhoneVerified || user.phoneVerified)) && (
          <div style={{ background: "var(--bg-card, #120A06)", borderRadius: "var(--radius-xl, 24px)", border: "1px solid var(--border-subtle, rgba(234,88,12,0.2))", padding: "32px", boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "#FFF9F3" }}>
              {user.phone ? "Verify phone number" : "Add phone number"}
            </h3>
            <p style={{ color: "var(--text-secondary, #A89B95)", fontSize: "0.95rem", marginBottom: "20px" }}>
              Required before placing an order. We send a one-time code via SMS.
            </p>
            {phoneStep === "idle" ? (
              <form onSubmit={handleRequestPhone} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  className="premium-input"
                  type="tel"
                  placeholder="03001234567"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  required
                  aria-label="Phone number"
                />
                <button type="submit" className="btn-premium" disabled={phoneLoading} style={{ width: "100%" }}>
                  {phoneLoading ? "Sending…" : "Send verification code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmPhone} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #A89B95)" }}>Code sent to {phoneInput}</p>
                <input
                  className="premium-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  aria-label="Verification code"
                />
                <button type="submit" className="btn-premium" disabled={phoneLoading} style={{ width: "100%" }}>
                  {phoneLoading ? "Verifying…" : "Confirm phone"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setPhoneStep("idle"); setPhoneOtp(""); }}
                >
                  Change number
                </button>
              </form>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "32px" }}>
          
          {/* Edit Info Form */}
          <div style={{ background: "var(--bg-card, #120A06)", borderRadius: "var(--radius-xl, 24px)", border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", padding: "32px", boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", paddingBottom: "12px", color: "#FFF9F3" }}>
              Edit Profile
            </h3>
            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                className="premium-input"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                className="premium-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={isLoading} className="btn-premium" style={{ width: "100%", marginTop: "8px" }}>
                {isLoading ? "Saving..." : "Update Details"}
              </button>
            </form>

            <h3 style={{ fontSize: "1.2rem", marginTop: "40px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", paddingBottom: "12px", color: "#FFF9F3" }}>
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="password"
                className="premium-input"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="premium-input"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="premium-input"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={isLoading} className="btn-premium" style={{ width: "100%", marginTop: "8px" }}>
                Update Password
              </button>
            </form>
          </div>

          {/* Saved Addresses & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Addresses */}
            <div style={{ background: "var(--bg-card, #120A06)", borderRadius: "var(--radius-xl, 24px)", border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", padding: "32px", boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", paddingBottom: "12px", color: "#FFF9F3" }}>
                📍 Saved Addresses
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "16px",
                      borderRadius: "var(--radius-lg, 18px)",
                      border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))",
                      background: "var(--bg-input, #1A0E08)",
                      transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
                    }}
                    className="address-card"
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem", color: "#FFF9F3" }}>{addr.label}</strong>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #A89B95)", marginTop: "4px", lineHeight: 1.4 }}>
                        {addr.addressLine}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{ 
                        color: "#EF4444", 
                        background: "rgba(220, 38, 38, 0.1)",
                        border: "none",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                      title="Delete Address"
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted, #736760)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                    No saved addresses yet. Add one during checkout.
                  </p>
                )}
              </div>
            </div>

            {/* Logout button */}
            <div style={{ background: "var(--bg-card, #120A06)", borderRadius: "var(--radius-xl, 24px)", border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", padding: "32px", boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "4px", color: "#FFF9F3" }}>Manage Account</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted, #736760)", marginBottom: "8px" }}>
                Sign out of your account on this device.
              </p>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="btn-danger"
                style={{ width: "100%", padding: "16px" }}
              >
                🚪 Logout Account
              </button>
            </div>

          </div>
        </div>

      </div>
      <style jsx>{`
        .premium-input {
          background: var(--bg-input, #1A0E08);
          border: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
          color: var(--text-primary, #FFF9F3);
          border-radius: var(--radius-md, 12px);
          padding: 14px 16px;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .premium-input:focus {
          border-color: var(--saffron, #EA580C);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
        }
        .btn-premium {
          background: linear-gradient(135deg, var(--primary, #C2410C) 0%, #EA580C 100%);
          color: #FFFFFF;
          border-radius: var(--radius-lg, 18px);
          border: none;
          font-weight: 700;
          padding: 16px;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.3);
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .btn-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(234, 88, 12, 0.4);
        }
        .btn-premium:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-premium:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-secondary, #A89B95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-lg, 18px);
          padding: 16px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.05);
          color: #FFF9F3;
        }
        .btn-danger {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          color: #EF4444;
          border-radius: var(--radius-lg, 18px);
          padding: 16px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .btn-danger:hover {
          background: rgba(220, 38, 38, 0.15);
        }
        .address-card:hover {
          transform: translateY(-2px);
        }
        .delete-btn:hover {
          background: rgba(220, 38, 38, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
