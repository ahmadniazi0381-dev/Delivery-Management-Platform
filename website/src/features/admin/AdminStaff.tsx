"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Edit2, Trash2, Shield, Eye, EyeOff,
  UserCheck, UserX, RefreshCw, Key, ChevronDown, ChevronUp,
  Activity, LogIn, Clock, ToggleLeft, ToggleRight, CheckCircle,
  Search, Filter, Download, LayoutList, LayoutGrid, DollarSign,
  Briefcase, Calendar, Phone, Mail, Award, FileText, UserPlus
} from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { useAuth } from "@/context/AuthContext";
import { useAdminQuery, adminFetch } from "./hooks/useAdminApi";
import { SkeletonCard, SkeletonTable } from "./components/SkeletonLoader";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StaffMember {
  id: string;
  staffRole: "OWNER" | "MANAGER" | "CASHIER" | "KDS" | "RIDER_MANAGER" | "BRANCH_MANAGER";
  permissions: string[];
  isActive: boolean;
  notes: string | null;
  cnic?: string;
  salary?: number;
  shift?: "MORNING" | "EVENING" | "NIGHT";
  department?: string;
  joiningDate?: string;
  assignedBranch?: string;
  lastLoginAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null; profilePicture: string | null };
  invitedBy: { id: string; name: string } | null;
}

interface StaffRolesData {
  roles: string[];
  permissions: string[];
  defaults: Record<string, string[]>;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OWNER:          { bg: "rgba(217,119,6,0.12)", text: "#d97706", border: "#d97706" },
  MANAGER:        { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "#6366f1" },
  CASHIER:        { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "#10b981" },
  KDS:            { bg: "rgba(236,72,153,0.12)", text: "#ec4899", border: "#ec4899" },
  RIDER_MANAGER:  { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "#3b82f6" },
  BRANCH_MANAGER: { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "#8b5cf6" },
};

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] || { bg: "var(--bg-secondary)", text: "var(--text-secondary)", border: "var(--border)" };
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-block"
    }}>
      {role.replace("_", " ")}
    </span>
  );
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span style={{
      width: 9, height: 9, borderRadius: "50%",
      background: isActive ? "#10b981" : "#ef4444",
      display: "inline-block", marginRight: 6, flexShrink: 0,
    }} />
  );
}

// ─── Staff Detail Profile Modal ─────────────────────────────────────────────
function StaffDetailModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 28, border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: ROLE_COLORS[member.staffRole]?.bg || "var(--bg-secondary)", color: ROLE_COLORS[member.staffRole]?.text || "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 900 }}>
              {member.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {member.user.name} <RoleBadge role={member.staffRole} />
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                ID: {member.id.substring(0, 8)} · Branch: {member.assignedBranch || "UCP Main Branch"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: "6px 14px" }}>Close</button>
        </div>

        {/* Profile Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div className="card" style={{ padding: 14 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>CONTACT & ACCOUNT</span>
            <div style={{ marginTop: 8, fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 6 }}>
              <div>📱 Phone: <strong>{member.user.phone || "N/A"}</strong></div>
              <div>✉️ Email: <strong>{member.user.email || "N/A"}</strong></div>
              <div>🆔 CNIC: <strong>{member.cnic || "35202-XXXXXXX-1"}</strong></div>
              <div>🟢 Account: <strong>{member.isActive ? "Active" : "Suspended"}</strong></div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>COMPENSATION & SHIFT</span>
            <div style={{ marginTop: 8, fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 6 }}>
              <div>💵 Monthly Salary: <strong style={{ color: "#10b981" }}>Rs. {(member.salary || 45000).toLocaleString()}</strong></div>
              <div>⏱️ Work Shift: <strong>{member.shift || "MORNING"} (8h)</strong></div>
              <div>🏢 Department: <strong>{member.department || "Operations"}</strong></div>
              <div>📅 Joining Date: <strong>{member.joiningDate || new Date(member.createdAt).toLocaleDateString()}</strong></div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Assigned System Permissions ({member.permissions.length})</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {member.permissions.map(p => (
              <span key={p} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", padding: "3px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600 }}>
                ✓ {p.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Audit */}
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
          <span>Created by: {member.invitedBy?.name || "System Owner"}</span>
          <span>Last Active: {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Staff Modal ────────────────────────────────────────────────
function StaffFormModal({
  staff,
  rolesData,
  defaultRole = "MANAGER",
  onClose,
  onSaved,
}: {
  staff: StaffMember | null;
  rolesData: StaffRolesData | null;
  defaultRole?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!staff;
  const [form, setForm] = useState({
    name: staff?.user.name || "",
    email: staff?.user.email || "",
    phone: staff?.user.phone || "",
    cnic: staff?.cnic || "",
    salary: staff?.salary || (defaultRole === "MANAGER" ? 65000 : 35000),
    shift: staff?.shift || "MORNING",
    department: staff?.department || "Operations",
    password: "",
    staffRole: staff?.staffRole || defaultRole,
    permissions: staff?.permissions || rolesData?.defaults?.[defaultRole] || [],
    notes: staff?.notes || "",
    isActive: staff?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPerms, setShowPerms] = useState(false);

  const handleRoleChange = (role: string) => {
    setForm((f) => ({
      ...f,
      staffRole: role as any,
      permissions: rolesData?.defaults?.[role] || [],
      salary: role === "MANAGER" ? 65000 : role === "CASHIER" ? 38000 : 32000,
    }));
  };

  const togglePerm = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await adminFetch(`/api/owner/staff/${staff!.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            staffRole: form.staffRole,
            permissions: form.permissions,
            isActive: form.isActive,
            notes: form.notes,
            salary: Number(form.salary),
            shift: form.shift,
            cnic: form.cnic,
          }),
        });
      } else {
        await adminFetch("/api/owner/staff", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            staffRole: form.staffRole,
            permissions: form.permissions,
            notes: form.notes,
            salary: Number(form.salary),
            shift: form.shift,
            cnic: form.cnic,
          }),
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 600,
          maxHeight: "92vh", overflowY: "auto", padding: 28,
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: 20 }}>
          {isEdit ? "Edit Staff Profile" : defaultRole === "MANAGER" ? "➕ Add Restaurant Manager" : "➕ Add Staff Member"}
        </h2>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Muhammad Abdullah" />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@restaurant.com" />
          </div>
          {!isEdit && (
            <div>
              <label className="form-label">Phone Number *</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="03054311118" />
            </div>
          )}
          {!isEdit && (
            <div style={{ gridColumn: "1/-1", position: "relative" }}>
              <label className="form-label">Password *</label>
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="At least 8 characters"
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                position: "absolute", right: 10, top: 34, background: "none", border: "none",
                color: "var(--text-secondary)", cursor: "pointer", display: "flex"
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}
          <div>
            <label className="form-label">CNIC Number</label>
            <input className="form-input" value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} placeholder="35202-XXXXXXX-1" />
          </div>
          <div>
            <label className="form-label">Monthly Salary (PKR)</label>
            <input className="form-input" type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} placeholder="45000" />
          </div>
          <div>
            <CustomSelect
              label="Role *"
              options={rolesData?.roles?.filter((r: string) => r !== "OWNER").map((r: string) => ({ value: r, label: r.replace("_", " ") })) || [
                { value: "MANAGER", label: "Restaurant Manager" },
                { value: "CASHIER", label: "Cashier" },
                { value: "KDS", label: "Kitchen Staff (KDS)" },
                { value: "BRANCH_MANAGER", label: "Branch Manager" },
              ]}
              value={form.staffRole}
              onChange={handleRoleChange}
              searchable={false}
            />
          </div>
          <div>
            <CustomSelect
              label="Work Shift"
              options={[
                { value: "MORNING", label: "Morning (8 AM - 4 PM)" },
                { value: "EVENING", label: "Evening (4 PM - 12 AM)" },
                { value: "NIGHT", label: "Night (12 AM - 8 AM)" },
              ]}
              value={form.shift}
              onChange={(val) => setForm(f => ({ ...f, shift: val as "MORNING" | "EVENING" | "NIGHT" }))}
              searchable={false}
            />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Notes / Instructions</label>
            <textarea className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: "vertical" }} />
          </div>
        </div>

        {/* Permissions accordion */}
        <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <button type="button" onClick={() => setShowPerms(v => !v)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-secondary)", border: "none", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
            <span>Permissions Matrix ({form.permissions.length} enabled)</span>
            {showPerms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showPerms && (
            <div style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(rolesData?.permissions || []).map(perm => {
                const enabled = form.permissions.includes(perm);
                return (
                  <button key={perm} type="button" onClick={() => togglePerm(perm)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600,
                      border: `1px solid ${enabled ? "#6366f1" : "var(--border)"}`,
                      background: enabled ? "rgba(99,102,241,0.12)" : "transparent",
                      color: enabled ? "#6366f1" : "var(--text-secondary)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {enabled && <CheckCircle size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />}
                    {perm.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ staffId, staffName, onClose }: { staffId: string; staffName: string; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminFetch(`/api/owner/staff/${staffId}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword }),
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 420, padding: 28, border: "1px solid var(--border)" }}>
        <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 8, color: "var(--text-primary)" }}>Reset Password</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 20 }}>Set a new temporary password for <strong>{staffName}</strong>. They will be prompted to change it on next login.</p>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={40} color="#10b981" style={{ marginBottom: 10 }} />
            <p style={{ color: "#10b981", fontWeight: 700 }}>Password reset successfully!</p>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 16 }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: "0.85rem" }}>{error}</div>}
            <div style={{ position: "relative" }}>
              <label className="form-label">New Password (min 8 chars)</label>
              <input className="form-input" type={showPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 10, top: 34, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Resetting…" : "Reset Password"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminStaff Component ────────────────────────────────────────────────
export default function AdminStaff() {
  const { user } = useAuth();
  const { data: rawStaffData, loading, refetch } = useAdminQuery<any>("/api/owner/staff", []);
  const { data: rolesData } = useAdminQuery<StaffRolesData>("/api/owner/staff/roles", []);

  const [modal, setModal] = useState<"create" | "create_manager" | "edit" | "reset" | "detail" | null>(null);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const router = useRouter();

  const isOwner = (user as any)?.staffRole === "OWNER";

  const staffList: StaffMember[] = useMemo(() => {
    const list = Array.isArray(rawStaffData) ? rawStaffData : rawStaffData?.data || [];
    return list.filter((s: StaffMember) => {
      const matchSearch =
        !search ||
        s.user.name.toLowerCase().includes(search.toLowerCase()) ||
        s.user.phone?.includes(search) ||
        s.user.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.staffRole.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "ALL" || s.staffRole === roleFilter;
      const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? s.isActive : !s.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [rawStaffData, search, roleFilter, statusFilter]);

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Delete staff member "${member.user.name}"? This action is irreversible.`)) return;
    setDeleting(member.id);
    try {
      await adminFetch(`/api/owner/staff/${member.id}`, { method: "DELETE" });
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to delete staff member.");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      await adminFetch(`/api/owner/staff/${member.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to update staff status.");
    }
  };

  const handleExportCSV = () => {
    if (staffList.length === 0) return;
    const headers = ["Name", "Role", "Phone", "Email", "Salary", "Shift", "Status", "Last Login"];
    const rows = staffList.map(s => [
      `"${s.user.name}"`,
      s.staffRole,
      s.user.phone || "",
      s.user.email || "",
      s.salary || 45000,
      s.shift || "MORNING",
      s.isActive ? "Active" : "Suspended",
      s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : "Never"
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `staff_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <Users color="#6366f1" size={28} /> Staff & Workforce Operations
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Manage staff profiles, permissions matrix, shifts, salaries, and operational access.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => refetch()} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
            <Download size={14} /> Export CSV
          </button>
          {isOwner && (
            <>
              <button onClick={() => { setSelected(null); setModal("create_manager"); }} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8, borderColor: "#6366f1", color: "#6366f1" }}>
                <UserPlus size={16} /> + Add Restaurant Manager
              </button>
              <button onClick={() => { setSelected(null); setModal("create"); }} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={16} /> + Add Staff
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Staff", value: staffList.length, color: "#6366f1" },
          { label: "Active Team", value: staffList.filter(s => s.isActive).length, color: "#10b981" },
          { label: "Suspended", value: staffList.filter(s => !s.isActive).length, color: "#ef4444" },
          { label: "Managers", value: staffList.filter(s => s.staffRole === "MANAGER" || s.staffRole === "BRANCH_MANAGER").length, color: "#d97706" },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: "18px 20px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{stat.label}</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar (Search, Filter, View Mode) */}
      <div className="card" style={{ padding: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: 260, flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-secondary)" }} />
            <input
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, role..."
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 160 }}>
            <option value="ALL">All Roles</option>
            <option value="MANAGER">Restaurant Manager</option>
            <option value="CASHIER">Cashier</option>
            <option value="KDS">Kitchen Staff (KDS)</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
          </select>
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-secondary)", padding: 2, borderRadius: 8, border: "1px solid var(--border)" }}>
          <button onClick={() => setViewMode("table")} style={{ padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: viewMode === "table" ? "var(--bg-card)" : "transparent", color: viewMode === "table" ? "#6366f1" : "var(--text-secondary)" }}>
            <LayoutList size={16} />
          </button>
          <button onClick={() => setViewMode("grid")} style={{ padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: viewMode === "grid" ? "var(--bg-card)" : "transparent", color: viewMode === "grid" ? "#6366f1" : "var(--text-secondary)" }}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Staff Content View */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : staffList.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <Users size={48} style={{ color: "var(--text-secondary)", margin: "0 auto 12px", opacity: 0.4 }} />
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 8 }}>No matching staff members</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 20 }}>Try adjusting your search query or role filter.</p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 18px" }}>Staff Member</th>
                <th style={{ padding: "14px" }}>Role & Dept</th>
                <th style={{ padding: "14px" }}>Salary & Shift</th>
                <th style={{ padding: "14px" }}>Contact & CNIC</th>
                <th style={{ padding: "14px" }}>Status</th>
                <th style={{ padding: "14px" }}>Last Login</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(member => (
                <tr key={member.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: ROLE_COLORS[member.staffRole]?.bg || "var(--bg-secondary)", color: ROLE_COLORS[member.staffRole]?.text || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{member.user.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ID: {member.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <RoleBadge role={member.staffRole} />
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>{member.department || "Operations"}</div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ fontWeight: 700, color: "#10b981" }}>Rs. {(member.salary || 45000).toLocaleString()}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Shift: {member.shift || "MORNING"}</div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div>{member.user.phone || member.user.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>CNIC: {member.cnic || "35202-XXXXXXX-1"}</div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: member.isActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: member.isActive ? "#10b981" : "#ef4444", border: `1px solid ${member.isActive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700 }}>
                      <StatusDot isActive={member.isActive} /> {member.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={{ padding: "14px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => router.push(`/dashboard/staff/${member.id}`)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-secondary)", cursor: "pointer", color: "var(--text-primary)", fontSize: "0.78rem" }}>
                        View Profile
                      </button>
                      {isOwner && member.staffRole !== "OWNER" && (
                        <>
                          <button onClick={() => { setSelected(member); setModal("edit"); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)", cursor: "pointer", color: "#6366f1", fontSize: "0.78rem" }}>
                            Edit
                          </button>
                          <button onClick={() => handleToggleActive(member)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${member.isActive ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, background: member.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", cursor: "pointer", color: member.isActive ? "#ef4444" : "#10b981", fontSize: "0.78rem" }}>
                            {member.isActive ? "Suspend" : "Activate"}
                          </button>
                          <button onClick={() => { setSelected(member); setModal("reset"); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(217,119,6,0.3)", background: "rgba(217,119,6,0.1)", cursor: "pointer", color: "#d97706", fontSize: "0.78rem" }}>
                            Reset PW
                          </button>
                          <button onClick={() => handleDelete(member)} disabled={deleting === member.id} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", cursor: "pointer", color: "#ef4444", fontSize: "0.78rem" }}>
                            {deleting === member.id ? "…" : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {staffList.map(member => (
            <div key={member.id} className="card" style={{ padding: 20, border: member.isActive ? "1px solid var(--border)" : "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: ROLE_COLORS[member.staffRole]?.bg || "var(--bg-secondary)", color: ROLE_COLORS[member.staffRole]?.text || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{member.user.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{member.user.phone || member.user.email}</div>
                  </div>
                </div>
                <RoleBadge role={member.staffRole} />
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div>💵 Salary: <strong style={{ color: "#10b981" }}>Rs. {(member.salary || 45000).toLocaleString()}</strong></div>
                <div>⏱️ Shift: <strong>{member.shift || "MORNING"}</strong></div>
                <div>🛡️ Permissions: <strong>{member.permissions.length} active</strong></div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <button onClick={() => router.push(`/dashboard/staff/${member.id}`)} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Profile</button>
                {isOwner && member.staffRole !== "OWNER" && (
                  <>
                    <button onClick={() => { setSelected(member); setModal("edit"); }} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Edit</button>
                    <button onClick={() => handleToggleActive(member)} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.78rem", color: member.isActive ? "#ef4444" : "#10b981" }}>{member.isActive ? "Suspend" : "Activate"}</button>
                    <button onClick={() => { setSelected(member); setModal("reset"); }} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Reset PW</button>
                    <button onClick={() => handleDelete(member)} className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal === "create" || modal === "create_manager" || modal === "edit") && (
        <StaffFormModal
          staff={modal === "edit" ? selected : null}
          rolesData={rolesData}
          defaultRole={modal === "create_manager" ? "MANAGER" : "CASHIER"}
          onClose={() => setModal(null)}
          onSaved={refetch}
        />
      )}
      {modal === "reset" && selected && (
        <ResetPasswordModal
          staffId={selected.id}
          staffName={selected.user.name}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "detail" && selected && (
        <StaffDetailModal
          member={selected}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
