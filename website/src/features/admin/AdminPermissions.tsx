"use client";

import React, { useState } from "react";
import { Shield, Save, CheckCircle, RotateCcw, Lock } from "lucide-react";
import { useAdminQuery, adminFetch } from "./hooks/useAdminApi";
import CustomSelect, { CustomSelectOption } from "@/components/CustomSelect";

const MODULES = [
  "Dashboard",
  "Orders",
  "Kitchen Display",
  "Menu",
  "Inventory",
  "Customers",
  "Riders",
  "Staff",
  "Salary",
  "Reports",
  "Analytics",
  "Settings",
  "Activity",
  "Branches",
  "Notifications",
  "Coupons",
  "Payments",
  "Roles",
] as const;

const ACTIONS = ["View", "Create", "Edit", "Delete", "Approve", "Export", "Manage"] as const;

type RolePreset = "Owner" | "Manager" | "Cashier" | "Kitchen" | "Inventory" | "Dispatcher" | "Support" | "Custom";

const ROLE_OPTIONS: CustomSelectOption[] = [
  { value: "Owner", label: "Owner", badge: "Full Access" },
  { value: "Manager", label: "Restaurant Manager", badge: "Operational" },
  { value: "Cashier", label: "Cashier", badge: "POS & Orders" },
  { value: "Kitchen", label: "Kitchen Staff", badge: "KDS Only" },
  { value: "Inventory", label: "Inventory Manager", badge: "Stock & Suppliers" },
  { value: "Dispatcher", label: "Rider Dispatcher", badge: "Riders & Orders" },
  { value: "Support", label: "Customer Support", badge: "Orders & Users" },
  { value: "Custom", label: "Custom Role Matrix", badge: "Configurable" },
];

// Presets mappings
const PRESET_PERMISSIONS: Record<RolePreset, Set<string>> = {
  Owner: new Set(MODULES.flatMap((m) => ACTIONS.map((a) => `${m}:${a}`))),
  Manager: new Set([
    "Dashboard:View", "Dashboard:Manage",
    "Orders:View", "Orders:Create", "Orders:Edit", "Orders:Approve", "Orders:Manage",
    "Kitchen Display:View", "Kitchen Display:Manage",
    "Menu:View", "Menu:Create", "Menu:Edit", "Menu:Manage",
    "Inventory:View", "Inventory:Create", "Inventory:Edit", "Inventory:Manage",
    "Customers:View", "Customers:Edit",
    "Riders:View", "Riders:Manage",
    "Staff:View",
    "Salary:View",
    "Reports:View", "Reports:Export",
    "Analytics:View",
    "Settings:View",
    "Activity:View",
  ]),
  Cashier: new Set([
    "Dashboard:View",
    "Orders:View", "Orders:Create", "Orders:Edit", "Orders:Approve",
    "Menu:View",
    "Customers:View",
    "Payments:View", "Payments:Create",
  ]),
  Kitchen: new Set([
    "Dashboard:View",
    "Kitchen Display:View", "Kitchen Display:Edit", "Kitchen Display:Manage",
    "Orders:View",
  ]),
  Inventory: new Set([
    "Dashboard:View",
    "Inventory:View", "Inventory:Create", "Inventory:Edit", "Inventory:Delete", "Inventory:Export", "Inventory:Manage",
    "Menu:View",
    "Reports:View", "Reports:Export",
  ]),
  Dispatcher: new Set([
    "Dashboard:View",
    "Orders:View", "Orders:Edit",
    "Riders:View", "Riders:Create", "Riders:Edit", "Riders:Manage",
  ]),
  Support: new Set([
    "Dashboard:View",
    "Orders:View", "Orders:Edit",
    "Customers:View", "Customers:Edit", "Customers:Manage",
    "Activity:View",
    "Notifications:View", "Notifications:Create",
  ]),
  Custom: new Set([
    "Dashboard:View",
    "Orders:View",
  ]),
};

export default function AdminPermissions() {
  const [selectedRole, setSelectedRole] = useState<RolePreset>("Manager");
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(PRESET_PERMISSIONS["Manager"])
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRoleChange = (roleVal: string) => {
    const role = roleVal as RolePreset;
    setSelectedRole(role);
    setPermissions(new Set(PRESET_PERMISSIONS[role]));
  };

  const togglePermission = (module: string, action: string) => {
    if (selectedRole === "Owner") return;
    const key = `${module}:${action}`;
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSelectedRole("Custom");
  };

  const toggleRowAll = (module: string) => {
    if (selectedRole === "Owner") return;
    const allRowKeys = ACTIONS.map((a) => `${module}:${a}`);
    const hasAll = allRowKeys.every((k) => permissions.has(k));

    setPermissions((prev) => {
      const next = new Set(prev);
      allRowKeys.forEach((k) => {
        if (hasAll) next.delete(k);
        else next.add(k);
      });
      return next;
    });
    setSelectedRole("Custom");
  };

  const toggleColumnAll = (action: string) => {
    if (selectedRole === "Owner") return;
    const allColKeys = MODULES.map((m) => `${m}:${action}`);
    const hasAll = allColKeys.every((k) => permissions.has(k));

    setPermissions((prev) => {
      const next = new Set(prev);
      allColKeys.forEach((k) => {
        if (hasAll) next.delete(k);
        else next.add(k);
      });
      return next;
    });
    setSelectedRole("Custom");
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await adminFetch("/owner/system-config", {
        method: "PUT",
        body: JSON.stringify({
          category: "RBAC",
          key: `ROLE_PERMISSIONS_${selectedRole.toUpperCase()}`,
          value: JSON.stringify(Array.from(permissions)),
        }),
      });

      localStorage.setItem(`naseeb_rbac_${selectedRole}`, JSON.stringify(Array.from(permissions)));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  const totalEnabled = permissions.size;
  const totalPossible = MODULES.length * ACTIONS.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield color="#6366f1" size={28} /> Central RBAC & Permission Matrix
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Granular access control, module visibility, and role permission policies.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {savedSuccess && (
            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={16} /> Saved & Applied!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Permission Matrix"}
          </button>
        </div>
      </div>

      {/* Preset Selector Card */}
      <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ minWidth: "260px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>SELECT ROLE PRESET</span>
          <div style={{ marginTop: "6px", width: "300px" }}>
            <CustomSelect
              options={ROLE_OPTIONS}
              value={selectedRole}
              onChange={handleRoleChange}
              searchable={false}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>ACTIVE PERMISSIONS</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#6366f1" }}>
              {totalEnabled} / {totalPossible}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPermissions(new Set(PRESET_PERMISSIONS[selectedRole]))}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}
          >
            <RotateCcw size={14} /> Reset Preset
          </button>
        </div>
      </div>

      {/* Matrix Notice */}
      {selectedRole === "Owner" && (
        <div style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: "12px", padding: "14px 18px", color: "#d97706", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
          <Lock size={18} />
          <span><strong>Owner Policy:</strong> Owner roles always maintain 100% full administrative access across all modules and actions.</span>
        </div>
      )}

      {/* PERMISSION MATRIX TABLE */}
      <div className="card" style={{ overflowX: "auto", borderRadius: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "14px 20px", minWidth: "200px", fontWeight: 800, color: "var(--text-primary)" }}>
                Module / Domain
              </th>
              {ACTIONS.map((action) => (
                <th
                  key={action}
                  onClick={() => toggleColumnAll(action)}
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    cursor: selectedRole === "Owner" ? "default" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <span title="Click to toggle column for all modules">{action}</span>
                </th>
              ))}
              <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "var(--text-secondary)" }}>
                Quick Toggle
              </th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module) => {
              const rowKeys = ACTIONS.map((a) => `${module}:${a}`);
              const rowEnabledCount = rowKeys.filter((k) => permissions.has(k)).length;
              const allRowEnabled = rowEnabledCount === ACTIONS.length;

              return (
                <tr key={module} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{module}</span>
                      {rowEnabledCount > 0 && (
                        <span style={{ fontSize: "0.7rem", background: "rgba(99,102,241,0.12)", color: "#6366f1", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>
                          {rowEnabledCount}/{ACTIONS.length}
                        </span>
                      )}
                    </div>
                  </td>

                  {ACTIONS.map((action) => {
                    const key = `${module}:${action}`;
                    const isChecked = permissions.has(key);

                    return (
                      <td key={action} style={{ padding: "14px 16px", textAlign: "center" }}>
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            border: isChecked ? "2px solid #6366f1" : "2px solid var(--border)",
                            background: isChecked ? "#6366f1" : "transparent",
                            cursor: selectedRole === "Owner" ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={selectedRole === "Owner"}
                            onChange={() => togglePermission(module, action)}
                            style={{ display: "none" }}
                          />
                          {isChecked && <CheckCircle size={16} color="#ffffff" />}
                        </label>
                      </td>
                    );
                  })}

                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <button
                      type="button"
                      disabled={selectedRole === "Owner"}
                      onClick={() => toggleRowAll(module)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "14px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        border: `1px solid ${allRowEnabled ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.4)"}`,
                        background: allRowEnabled ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
                        color: allRowEnabled ? "#ef4444" : "#6366f1",
                        cursor: selectedRole === "Owner" ? "not-allowed" : "pointer",
                      }}
                    >
                      {allRowEnabled ? "Clear Module" : "Select All"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
