"use client";

/**
 * Sound & Notification Settings — REQ-NOTIFICATION-SOUND-SYSTEM-001
 *
 * All settings are persisted to localStorage (naseeb_sound_settings).
 * Changes take effect immediately — no save button required.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Play,
  AlertTriangle,
  CheckCircle2,
  Info,
  Moon,
  Settings,
  Zap,
} from "lucide-react";
import {
  DEFAULT_SOUND_SETTINGS,
  loadSoundSettings,
  saveSoundSettings,
  useSoundSystem,
  type SoundSettings,
} from "@/features/admin/hooks/useSoundSystem";
import { useToast } from "@/components/AdminToast";

// ─── Row Component ────────────────────────────────────────────────────────────

type SoundRowProps = {
  label: string;
  description: string;
  priority: "critical" | "success" | "warning" | "info";
  enabled: boolean;
  onToggle: () => void;
  onTest: () => void;
};

const PRIORITY_STYLES = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "CRITICAL · Loop", icon: <Zap size={14} /> },
  success:  { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "SUCCESS · Once",  icon: <CheckCircle2 size={14} /> },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "WARNING · Once",  icon: <AlertTriangle size={14} /> },
  info:     { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "SILENT",         icon: <Info size={14} /> },
};

function SoundRow({ label, description, priority, enabled, onToggle, onTest }: SoundRowProps) {
  const style = PRIORITY_STYLES[priority];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        borderRadius: "10px",
        border: `1px solid ${enabled ? style.color + "33" : "var(--border)"}`,
        background: enabled ? style.bg : "transparent",
        transition: "all 0.2s ease",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{label}</span>
          <span
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "0.7rem", fontWeight: 700, color: style.color,
              background: style.bg, padding: "2px 8px", borderRadius: "20px",
            }}
          >
            {style.icon} {style.label}
          </span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>{description}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {priority !== "info" && (
          <button
            onClick={onTest}
            disabled={!enabled}
            title="Test sound"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border)",
              background: "var(--bg-secondary)", color: enabled ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: "0.82rem", fontWeight: 600, cursor: enabled ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
            }}
          >
            <Play size={12} /> Test
          </button>
        )}

        {/* Toggle switch */}
        <button
          onClick={onToggle}
          role="switch"
          aria-checked={enabled}
          style={{
            width: "48px", height: "26px", borderRadius: "13px",
            background: enabled ? style.color : "var(--border)",
            border: "none", cursor: "pointer",
            position: "relative", transition: "background 0.2s ease", flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute", top: "3px",
              left: enabled ? "25px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SOUND_SETTINGS);
  const { testSound } = useSoundSystem();
  const { addToast } = useToast();

  // Load on mount
  useEffect(() => {
    setSettings(loadSoundSettings());
  }, []);

  // Save on every change
  const update = useCallback((updater: (prev: SoundSettings) => SoundSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveSoundSettings(next);
      return next;
    });
  }, []);

  const toggleSound = (key: keyof SoundSettings["sounds"]) => {
    update((prev) => ({
      ...prev,
      sounds: { ...prev.sounds, [key]: !prev.sounds[key] },
    }));
  };

  const handleTest = (type: "newOrder" | "paymentSuccess" | "paymentFailed") => {
    if (settings.muteAll || !settings.masterEnabled) {
      addToast({ type: "warning", title: "Sound Muted", message: "Enable master sound to test." });
      return;
    }
    testSound(type);
    addToast({ type: "info", title: "Playing test sound…", duration: 2000 });
  };

  const requestBrowserNotification = async () => {
    if (!("Notification" in window)) {
      addToast({ type: "error", title: "Not Supported", message: "Your browser does not support notifications." });
      return;
    }
    const result = await Notification.requestPermission();
    if (result === "granted") {
      addToast({ type: "success", title: "Notifications Enabled", message: "You will receive browser notifications for new orders." });
      new Notification("Naseeb Admin Notifications", {
        body: "Browser notifications are now active.",
        icon: "/favicon.ico",
      });
    } else {
      addToast({ type: "error", title: "Permission Denied", message: "Browser notification permission was denied." });
    }
  };

  const notifPermission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "780px" }} className="fade-in">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Sound & Notification Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Configure how the kitchen and counter staff are alerted to new orders and payments.
        </p>
      </div>

      {/* ── Master Controls ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          <Settings size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Master Controls
        </h2>

        {/* Mute All */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: "10px", background: settings.muteAll ? "rgba(239,68,68,0.08)" : "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {settings.muteAll ? <VolumeX size={20} color="#ef4444" /> : <Volume2 size={20} color="var(--text-secondary)" />}
            <div style={{ marginLeft: "12px" }}>
              <div style={{ fontWeight: 700, color: settings.muteAll ? "#ef4444" : "var(--text-primary)" }}>
                {settings.muteAll ? "🔇 All Sounds Muted" : "Master Sound"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Mute all sounds temporarily — override for all settings below.
              </div>
            </div>
          </div>
          <button
            onClick={() => update((p) => ({ ...p, muteAll: !p.muteAll }))}
            role="switch"
            aria-checked={settings.muteAll}
            style={{
              width: "48px", height: "26px", borderRadius: "13px",
              background: settings.muteAll ? "#ef4444" : "var(--border)",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 0.2s ease",
            }}
          >
            <span style={{
              position: "absolute", top: "3px",
              left: settings.muteAll ? "25px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
          </button>
        </div>

        {/* Volume Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              Volume
            </label>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--saffron)" }}>
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => update((p) => ({ ...p, volume: parseFloat(e.target.value) }))}
            style={{ width: "100%", accentColor: "var(--saffron)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Enable/Disable Master */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>Enable All Sounds</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Global on/off for all notification sounds.</div>
          </div>
          <button
            onClick={() => update((p) => ({ ...p, masterEnabled: !p.masterEnabled }))}
            role="switch"
            aria-checked={settings.masterEnabled}
            style={{
              width: "48px", height: "26px", borderRadius: "13px",
              background: settings.masterEnabled ? "#10b981" : "var(--border)",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 0.2s ease",
            }}
          >
            <span style={{
              position: "absolute", top: "3px",
              left: settings.masterEnabled ? "25px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
          </button>
        </div>
      </div>

      {/* ── Sound Tiers ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          <Bell size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Notification Sounds
        </h2>

        {/* CRITICAL */}
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
          🔴 Critical — Loop Until Acknowledged
        </div>
        <SoundRow
          label="New Customer Order"
          description="Plays foodpanda-style alert on loop until an admin accepts, rejects, or cancels the order. Never stops on its own."
          priority="critical"
          enabled={settings.sounds.newOrder}
          onToggle={() => toggleSound("newOrder")}
          onTest={() => handleTest("newOrder")}
        />

        {/* SUCCESS */}
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>
          🟢 Success — Play Once
        </div>
        <SoundRow
          label="Payment Successful"
          description="Plays a pleasant cash-register sound when an online payment (JazzCash, EasyPaisa, Card) is verified. Never plays for COD."
          priority="success"
          enabled={settings.sounds.paymentSuccess}
          onToggle={() => toggleSound("paymentSuccess")}
          onTest={() => handleTest("paymentSuccess")}
        />

        {/* WARNING */}
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>
          🟡 Warning — Play Once
        </div>
        <SoundRow
          label="Payment Failed / Declined"
          description="Plays a distinct warning tone when an online payment fails, is declined, or cancelled by the customer."
          priority="warning"
          enabled={settings.sounds.paymentFailed}
          onToggle={() => toggleSound("paymentFailed")}
          onTest={() => handleTest("paymentFailed")}
        />
        <SoundRow
          label="Rider Arrived at Restaurant"
          description="Alerts kitchen staff that the rider is waiting at the counter."
          priority="warning"
          enabled={settings.sounds.riderArrivedRestaurant}
          onToggle={() => toggleSound("riderArrivedRestaurant")}
          onTest={() => handleTest("newOrder")}
        />
        <SoundRow
          label="Rider Arrived at Customer"
          description="Confirmation sound that rider has reached the delivery location."
          priority="warning"
          enabled={settings.sounds.riderArrivedCustomer}
          onToggle={() => toggleSound("riderArrivedCustomer")}
          onTest={() => handleTest("newOrder")}
        />
        <SoundRow
          label="Low Inventory Warning"
          description="Alert when a menu item's stock drops below the threshold."
          priority="warning"
          enabled={settings.sounds.lowInventory}
          onToggle={() => toggleSound("lowInventory")}
          onTest={() => handleTest("paymentFailed")}
        />

        {/* INFO */}
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>
          🔵 Informational — Silent
        </div>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          The following events are tracked silently — no sound, visible only in the dashboard:
          <ul style={{ marginTop: "8px", paddingLeft: "20px", lineHeight: 1.8 }}>
            <li>New Customer Registration</li>
            <li>New Review Submitted</li>
            <li>Analytics Update</li>
            <li>Announcements</li>
          </ul>
        </div>
      </div>

      {/* ── Quiet Hours ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            <Moon size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            Quiet Hours
          </h2>
          <button
            onClick={() => update((p) => ({ ...p, quietHours: { ...p.quietHours, enabled: !p.quietHours.enabled } }))}
            role="switch"
            aria-checked={settings.quietHours.enabled}
            style={{
              width: "48px", height: "26px", borderRadius: "13px",
              background: settings.quietHours.enabled ? "#10b981" : "var(--border)",
              border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s ease",
            }}
          >
            <span style={{
              position: "absolute", top: "3px",
              left: settings.quietHours.enabled ? "25px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
          </button>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
          During quiet hours, all notification sounds are suppressed. Visual alerts continue to work.
        </p>

        {settings.quietHours.enabled && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
                Start Time
              </label>
              <input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => update((p) => ({ ...p, quietHours: { ...p.quietHours, start: e.target.value } }))}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
                End Time
              </label>
              <input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => update((p) => ({ ...p, quietHours: { ...p.quietHours, end: e.target.value } }))}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Browser Notifications ────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          <Bell size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Browser Notifications
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
          Browser pop-up notifications for new orders, even when the tab is in the background.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              Status:{" "}
              <span style={{ color: notifPermission === "granted" ? "#10b981" : notifPermission === "denied" ? "#ef4444" : "#f59e0b" }}>
                {notifPermission === "granted" ? "✓ Enabled" : notifPermission === "denied" ? "✗ Blocked" : "Not yet requested"}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              {notifPermission === "denied" && "Go to browser settings → Site permissions to re-enable."}
            </div>
          </div>
          {notifPermission !== "granted" && notifPermission !== "denied" && (
            <button onClick={requestBrowserNotification} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              Enable
            </button>
          )}
          {notifPermission === "granted" && (
            <button
              onClick={() => {
                new Notification("Test Notification", { body: "Naseeb Admin notifications are working.", icon: "/favicon.ico" });
              }}
              className="btn btn-secondary"
            >
              Test
            </button>
          )}
        </div>
      </div>

      {/* ── Reset ────────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
          Reset Settings
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Restore all sound and notification settings to their factory defaults.
        </p>
        <button
          onClick={() => {
            saveSoundSettings(DEFAULT_SOUND_SETTINGS);
            setSettings(DEFAULT_SOUND_SETTINGS);
            addToast({ type: "success", title: "Settings Reset", message: "All sound settings restored to defaults." });
          }}
          className="btn btn-secondary"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
