"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { getGoogleClientId } from "@/lib/googleIdentity";

type AuthMode = "login" | "register" | "otp";

function LoginForm() {
  const [mode, setMode]           = useState<AuthMode>("login");
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [otp, setOtp]             = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const { user, login, applySession } = useAuth();
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const redirectTo     = searchParams.get("redirect") || "/cart";

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = user.role?.toUpperCase();
      let destination = redirectTo;
      if (role === 'ADMIN') {
        destination = redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
      } else if (role === 'RIDER') {
        destination = redirectTo.startsWith("/rider") ? redirectTo : "/rider";
      } else {
        if (redirectTo.startsWith("/dashboard") || redirectTo.startsWith("/rider")) {
          destination = "/menu";
        }
      }
      router.push(destination);
    }
  }, [user, redirectTo, router]);

  // Normalize Pakistani phone numbers (strips dashes/spaces/parens)
  const normalizePhone = (raw: string) => {
    let c = raw.replace(/[^\d+]/g, "");
    if (c.startsWith("0092")) c = "+" + c.slice(4);
    if (c.startsWith("92") && c.length === 12) c = "+" + c;
    if (c.startsWith("03") && c.length === 11) c = "+92" + c.slice(1);
    if (c.startsWith("3") && c.length === 10) c = "+92" + c;
    return c;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!phone || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    const identifier = phone.includes("@") ? phone.trim() : normalizePhone(phone);
    const result = await login(identifier, password);
    if (result.success) {
      const role = result.user?.role?.toUpperCase();
      let destination = redirectTo;
      if (result.user?.mustChangePassword) {
        destination = "/profile";
      } else if (role === 'ADMIN') {
        destination = redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
      } else if (role === 'RIDER') {
        destination = redirectTo.startsWith("/rider") ? redirectTo : "/rider";
      } else {
        if (redirectTo.startsWith("/dashboard") || redirectTo.startsWith("/rider")) {
          destination = "/menu";
        }
      }
      router.push(destination);
    } else {
      setError(result.message || "Login failed.");
    }
    setIsLoading(false);
  };

  const handleDevLogin = async (email: string, pass: string) => {
    setError(""); setSuccess("");
    setIsLoading(true);
    setPhone(email);
    setPassword(pass);
    const result = await login(email, pass);
    if (result.success) {
      setSuccess(`Logged in as dev ${email.split('@')[0]}!`);
      const role = result.user?.role;
      const destination =
        result.user?.mustChangePassword ? '/profile' :
        role === 'ADMIN' ? '/dashboard' :
        role === 'RIDER' ? '/rider' :
        redirectTo || '/menu';
      setTimeout(() => {
        router.push(destination);
      }, 500);
    } else {
      setError(result.message || "Dev login failed.");
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name || !phone || !password) { setError("Name, phone, and password are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setIsLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      const payload: any = { name, phone: normalizedPhone, password };
      if (email.trim() !== "") {
        payload.email = email.trim();
      }

      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      // Backend returns { message, token, user } on success (no 'success' field)
      if (res.ok && data.token) {
        // Auto-login after registration
        localStorage.setItem("naseeb_token", data.token);
        localStorage.setItem("naseeb_user", JSON.stringify(data.user));
        setSuccess("Account created! Redirecting…");
        setTimeout(() => router.push(redirectTo), 800);
      } else {
        setError(data.error || data.message || "Registration failed.");
      }
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!otp || otp.length < 4) { setError("Please enter the OTP."); return; }
    setIsLoading(true);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/menu");
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch {
      // Dev fallback
      router.push("/menu");
    } finally {
      setIsLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────
  const renderForm = () => {
    if (mode === "otp") {
      return (
        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "4px" }}>📱</div>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Enter the 6-digit OTP sent to <strong>{phone}</strong>
          </p>
          <div className="input-group">
            <span className="input-icon">🔢</span>
            <input
              type="text"
              className="input"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              id="otp-input"
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: "1.25rem" }}
              autoFocus
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: "100%" }}>
            {isLoading ? "Verifying…" : "Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            style={{ background: "none", border: "none", color: "var(--saffron)", fontSize: "0.875rem", cursor: "pointer" }}
          >
            ← Back
          </button>
        </form>
      );
    }

    if (mode === "register") {
      return (
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="input-group">
            <span className="input-icon">👤</span>
            <input type="text" className="input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} id="reg-name" />
          </div>
          <div className="input-group">
            <span className="input-icon">📞</span>
            <input type="tel" className="input" placeholder="Phone Number (e.g. 03XX XXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} id="reg-phone" />
          </div>
          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input type="email" className="input" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} id="reg-email" />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type={showPass ? "text" : "password"}
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="reg-password"
              style={{ paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{ position: "absolute", right: "14px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }}>
            {isLoading ? "Creating Account…" : "Create Account →"}
          </button>
        </form>
      );
    }

    // Login
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="input-group">
            <span className="input-icon">📞</span>
            <input
              type="text"
              className="input"
              placeholder="Phone Number or Email"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              id="login-phone"
              autoComplete="username"
            />
          </div>
          <div className="input-group" style={{ position: "relative" }}>
            <span className="input-icon">🔒</span>
            <input
              type={showPass ? "text" : "password"}
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="login-password"
              autoComplete="current-password"
              style={{ paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{ position: "absolute", right: "14px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              aria-label="Toggle password visibility"
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} id="login-submit">
            {isLoading ? "Logging in…" : "Login →"}
          </button>
        </form>

        {/* Temporary Dev Logins (Always visible in development/demo environments) */}
        {process.env.NODE_ENV !== "production" && (
          <div style={{
            marginTop: "16px",
            padding: "16px",
            background: "rgba(245, 158, 11, 0.08)",
            borderRadius: "var(--radius-md)",
            border: "1.5px dashed var(--saffron)"
          }}>
            <p style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--saffron)",
              marginBottom: "8px",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              🛠️ Temporary Developer Logins
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleDevLogin("admin@test.com", "Admin123@")}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: "0.75rem", padding: "6px 4px", justifyContent: "center" }}
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleDevLogin("customer@test.com", "Customer123@")}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: "0.75rem", padding: "6px 4px", justifyContent: "center" }}
              >
                👤 Customer
              </button>
              <button
                type="button"
                onClick={() => handleDevLogin("rider@test.com", "Rider123@")}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: "0.75rem", padding: "6px 4px", justifyContent: "center" }}
              >
                🚴 Rider
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      {/* Left Decorative Panel (hidden on mobile) */}
      <div
        className="auth-panel-left"
        style={{
          flex: 1,
          maxWidth: "480px",
          background: "var(--grad-hero)",
          borderRadius: "var(--radius-xl)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 40px",
          textAlign: "center",
          marginRight: "32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "6rem", marginBottom: "24px" }} className="animate-float">
          🍛
        </div>
        <h2
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "#FEF3C7",
            marginBottom: "12px",
          }}
        >
          Karachi&apos;s Taste,
          <br />
          Lahore&apos;s Heart
        </h2>
        <p style={{ color: "rgba(254,243,199,0.75)", fontSize: "0.95rem", lineHeight: 1.7 }}>
          Join thousands of satisfied customers and enjoy authentic Karachi
          biryani delivered fresh to your door.
        </p>

        {/* Feature list */}
        {["Free delivery on first order", "30-min delivery guarantee", "Multiple payment options"].map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "12px",
              color: "rgba(254,243,199,0.82)",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "#F59E0B" }}>✓</span>
            {t}
          </div>
        ))}
      </div>

      {/* Auth Form Box */}
      <div
        className="card animate-scale-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px 36px",
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
            {mode === "otp" ? "📱" : "👋"}
          </div>
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            {mode === "login"    && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "otp"      && "Verify Your Phone"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {mode === "login"    && "Login to place your order"}
            {mode === "register" && "Sign up to get started"}
            {mode === "otp"      && "An OTP was sent to your number"}
          </p>
        </div>

        {/* Tab Switch */}
        {mode !== "otp" && (
          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              borderRadius: "var(--radius-md)",
              padding: "4px",
              marginBottom: "24px",
            }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  background: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? "var(--saffron)" : "var(--text-muted)",
                  boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s ease",
                  textTransform: "capitalize",
                }}
                id={`auth-tab-${m}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="toast toast-error" style={{ marginBottom: "16px", position: "static", minWidth: "unset", width: "100%" }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="toast toast-success" style={{ marginBottom: "16px", position: "static", minWidth: "unset", width: "100%" }}>
            ✅ {success}
          </div>
        )}

        {/* Form */}
        {renderForm()}

        {/* Divider */}
        {mode === "login" && (
          <>
            <div className="divider" style={{ margin: "20px 0" }}>or continue with</div>
            {getGoogleClientId() ? (
              <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    const idToken = credentialResponse.credential;
                    if (!idToken) {
                      setError("Google did not return a credential.");
                      return;
                    }
                    setError("");
                    setIsLoading(true);
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken }),
                      });
                      const data = await res.json();
                      if (res.ok && data.token) {
                        applySession(data.token, data.user);
                        const role = data.user?.role?.toUpperCase();
                        let destination = redirectTo;
                        if (role === 'ADMIN') {
                          destination = redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
                        } else if (role === 'RIDER') {
                          destination = redirectTo.startsWith("/rider") ? redirectTo : "/rider";
                        } else {
                          if (redirectTo.startsWith("/dashboard") || redirectTo.startsWith("/rider")) {
                            destination = "/menu";
                          }
                        }
                        router.push(destination);
                      } else {
                        setError(data.error || "Google login failed.");
                      }
                    } catch {
                      setError("Network error.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onError={() => setError("Google sign-in was cancelled or failed.")}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            ) : (
              <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Google sign-in is not configured.
              </p>
            )}
          </>
        )}

        {/* Bottom note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          By continuing, you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--saffron)" }}>Terms</Link> &amp;{" "}
          <Link href="/privacy-policy" style={{ color: "var(--saffron)" }}>Privacy Policy</Link>.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-panel-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-secondary)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "3rem" }} className="animate-pulse">🍛</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 500 }}>Loading Naseeb Baryani…</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
