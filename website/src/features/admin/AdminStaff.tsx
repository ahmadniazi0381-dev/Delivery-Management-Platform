"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, Edit2, Trash2, Shield, Eye, EyeOff,
  UserCheck, UserX, RefreshCw, Key, ChevronDown, ChevronUp,
  Activity, LogIn, Clock, ToggleLeft, ToggleRight, CheckCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminQuery, useAdminMutation, adminFetch } from "./hooks/useAdminApi";
import { SkeletonCard } from "./components/SkeletonLoader";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StaffMember {
  id: string;
  staffRole: "OWNER" | "MANAGER" | "CASHIER" | "KDS" | "RIDER_MANAGER" | "BRANCH_MANAGER";
  permissions: string[];
  isActive: boolean;
  notes: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null; profilePicture: string | null };
  invitedBy: { user: { id: string; name: string } } | null;
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
      textTransform: "uppercase", letterSpacing: "0.5px",
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

// ─── Create / Edit Staff Modal ────────────────────────────────────────────────
function StaffFormModal({
  staff,
  rolesData,
  onClose,
  onSaved,
}: {
  staff: StaffMember | null;
  rolesData: StaffRolesData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!staff;
  const [form, setForm] = useState({
    name: staff?.user.name || "",
    email: staff?.user.email || "",
    phone: staff?.user.phone || "",
    password: "",
    staffRole: staff?.staffRole || "MANAGER",
    permissions: staff?.permissions || rolesData?.defaults?.MANAGER || [],
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
          background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 560,
          maxHeight: "92vh", overflowY: "auto", padding: 28,
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: 20 }}>
          {isEdit ? "Edit Staff Member" : "Add New Staff"}
        </h2>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          {!isEdit && (
            <div>
              <label className="form-label">Phone *</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
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
            <label className="form-label">Role *</label>
            <select className="form-input" value={form.staffRole} onChange={e => handleRoleChange(e.target.value)}>
              {(rolesData?.roles || ["MANAGER", "CASHIER", "KDS"]).filter(r => r !== "OWNER").map(r => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: form.isActive ? "#10b981" : "#ef4444" }}>
                {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{form.isActive ? "Active" : "Suspended"}</span>
              </button>
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Notes (internal)</label>
            <textarea className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: "vertical" }} />
          </div>
        </div>

        {/* Permissions accordion */}
        <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <button type="button" onClick={() => setShowPerms(v => !v)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-secondary)", border: "none", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
            <span>Permissions ({form.permissions.length} enabled)</span>
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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Staff"}
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
  const { data: staffData, loading, refetch } = useAdminQuery<StaffMember[]>("/api/owner/staff", []);
  const { data: rolesData } = useAdminQuery<StaffRolesData>("/api/owner/staff/roles", []);
  const [modal, setModal] = useState<"create" | "edit" | "reset" | null>(null);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedPerms, setExpandedPerms] = useState<string | null>(null);

  const isOwner = (user as any)?.staffRole === "OWNER";

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

  const staffList = staffData || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Staff Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Manage roles, permissions, and access for your team.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => refetch()} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
            <RefreshCw size={14} />
          </button>
          {isOwner && (
            <button onClick={() => { setSelected(null); setModal("create"); }} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={16} /> Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Staff", value: staffList.length, color: "#6366f1" },
          { label: "Active", value: staffList.filter(s => s.isActive).length, color: "#10b981" },
          { label: "Suspended", value: staffList.filter(s => !s.isActive).length, color: "#ef4444" },
          { label: "Managers", value: staffList.filter(s => s.staffRole === "MANAGER").length, color: "#d97706" },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: "18px 20px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{stat.label}</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} h="200px" />)}
        </div>
      ) : staffList.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <Users size={48} style={{ color: "var(--text-secondary)", margin: "0 auto 12px" }} />
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 8 }}>No staff members yet</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 20 }}>Add your first staff member to get started.</p>
          {isOwner && (
            <button onClick={() => { setSelected(null); setModal("create"); }} className="btn btn-primary">
              <Plus size={16} style={{ marginRight: 6 }} /> Add First Staff
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {staffList.map(member => (
            <div key={member.id} className="card" style={{
              padding: 20,
              border: member.isActive ? "1px solid var(--border)" : "1px solid rgba(239,68,68,0.3)",
              opacity: member.isActive ? 1 : 0.75,
              transition: "all 0.2s",
            }}>
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: ROLE_COLORS[member.staffRole]?.bg || "var(--bg-secondary)",
                    color: ROLE_COLORS[member.staffRole]?.text || "var(--text-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 800, flexShrink: 0,
                  }}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusDot isActive={member.isActive} />
                      {member.user.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                      {member.user.phone || member.user.email || "No contact"}
                    </div>
                  </div>
                </div>
                <RoleBadge role={member.staffRole} />
              </div>

              {/* Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, fontSize: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <Clock size={13} />
                  <span>Last login: {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "Never"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <Shield size={13} />
                  <span>{member.permissions.length} permissions active</span>
                  <button onClick={() => setExpandedPerms(expandedPerms === member.id ? null : member.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "0.72rem", fontWeight: 600, padding: 0 }}>
                    {expandedPerms === member.id ? "Hide" : "View"}
                  </button>
                </div>
                {expandedPerms === member.id && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {member.permissions.map(p => (
                      <span key={p} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", padding: "2px 8px", borderRadius: 10, fontSize: "0.67rem", fontWeight: 600 }}>
                        {p.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
                {member.invitedBy && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                    <UserCheck size={13} />
                    <span>Created by {member.invitedBy.user.name}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isOwner && member.staffRole !== "OWNER" && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => { setSelected(member); setModal("edit"); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", cursor: "pointer" }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleToggleActive(member)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, background: member.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: member.isActive ? "#ef4444" : "#10b981", border: `1px solid ${member.isActive ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, cursor: "pointer" }}>
                    {member.isActive ? <><UserX size={12} /> Suspend</> : <><UserCheck size={12} /> Activate</>}
                  </button>
                  <button onClick={() => { setSelected(member); setModal("reset"); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, background: "rgba(217,119,6,0.1)", color: "#d97706", border: "1px solid rgba(217,119,6,0.2)", cursor: "pointer" }}>
                    <Key size={12} /> Reset PW
                  </button>
                  <button onClick={() => handleDelete(member)} disabled={deleting === member.id}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                    <Trash2 size={12} /> {deleting === member.id ? "…" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <StaffFormModal
          staff={modal === "edit" ? selected : null}
          rolesData={rolesData}
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
    </div>
  );
}
