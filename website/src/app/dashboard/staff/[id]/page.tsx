"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, Mail, Shield, Calendar, DollarSign,
  Clock, MapPin, Building, Activity, Edit2, Key, ToggleLeft, ToggleRight,
  Award, FileText, AlertTriangle, CheckCircle, RefreshCw, Trash2,
  CreditCard, UserPlus, BarChart2, LogIn, BookOpen, Briefcase,
  HeartPulse, Target, Layers, History, Download, Eye, EyeOff,
  Repeat, Copy, MoreVertical
} from "lucide-react";
import { useAdminQuery, adminFetch } from "@/features/admin/hooks/useAdminApi";
import { useAuth } from "@/context/AuthContext";
import { Tooltip } from "@/components/Tooltip";

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
      padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.5px",
    }}>
      {role.replace(/_/g, " ")}
    </span>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      {icon && <div style={{ color: "var(--text-secondary)", marginTop: 2, flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: active ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
      color: active ? "#10b981" : "#ef4444",
      border: `1px solid ${active ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
    }}>
      {active ? "● Active" : "● Suspended"}
    </span>
  );
}

function MetricCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const staffId = params?.id as string;

  const { data: allStaffData, loading, refetch } = useAdminQuery<any>("/api/owner/staff", []);
  const { data: staffActionHistory } = useAdminQuery<any>(`/api/owner/staff/${staffId}/history`, []);
  const { data: loginHistoryData } = useAdminQuery<any>(`/api/owner/login-history?userId=${staffId}`, []);
  const { data: salaryHistoryData } = useAdminQuery<any>(`/api/owner/salary/${staffId}`, []);
  const { data: staffAttendance } = useAdminQuery<any>(`/api/owner/staff/${staffId}/attendance`, []);
  const { data: assignedOrders } = useAdminQuery<any>(`/api/owner/staff/${staffId}/orders`, []);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwDone, setPwDone] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "salary" | "activity" | "performance" | "orders">("overview");

  const staffList = Array.isArray(allStaffData) ? allStaffData : allStaffData?.data || [];
  const member = staffList.find((s: any) => s.id === staffId);

  const isOwner = (user as any)?.staffRole === "OWNER";

  const handleToggleActive = useCallback(async () => {
    if (!member) return;
    setActionLoading("toggle");
    try {
      await adminFetch(`/api/owner/staff/${staffId}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  }, [member, staffId, refetch]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete staff member "${member?.user?.name}"? This is irreversible.`)) return;
    setActionLoading("delete");
    try {
      await adminFetch(`/api/owner/staff/${staffId}`, { method: "DELETE" });
      router.push("/dashboard/staff");
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  }, [member, staffId, router]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    setActionLoading("resetpw");
    try {
      await adminFetch(`/api/owner/staff/${staffId}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword }),
      });
      setPwDone(true);
    } catch (err: any) {
      alert(err.message || "Failed to reset password");
    } finally {
      setActionLoading(null);
    }
  }, [staffId, newPassword]);

  const handleDuplicate = useCallback(async () => {
    if (!confirm(`Duplicate staff profile for "${member?.user?.name}"? This creates a new account.`)) return;
    setActionLoading("duplicate");
    try {
      const newStaff = {
        name: member.user.name + " (Copy)",
        email: member.user.email,
        phone: member.user.phone,
        password: "TempPass123!",
        staffRole: member.staffRole,
        permissions: member.permissions,
        notes: "Duplicated from " + member.user.name,
        salary: member.salary,
        shift: member.shift,
        cnic: member.cnic,
        department: member.department,
        joiningDate: member.joiningDate,
        assignedBranch: member.assignedBranch,
      };
      await adminFetch("/api/owner/staff", {
        method: "POST",
        body: JSON.stringify(newStaff),
      });
      alert("Staff duplicated. Please edit the new profile to update contact details.");
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to duplicate");
    } finally {
      setActionLoading(null);
    }
  }, [member, refetch]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ height: 32, background: "var(--bg-secondary)", borderRadius: 8, width: 200, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 180, background: "var(--bg-secondary)", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 200, background: "var(--bg-secondary)", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="card" style={{ padding: 48, textAlign: "center" }}>
        <AlertTriangle size={48} style={{ color: "var(--text-secondary)", margin: "0 auto 12px", opacity: 0.4 }} />
        <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 8 }}>Staff Member Not Found</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>The requested staff profile could not be found.</p>
        <Link href="/dashboard/staff">
          <button className="btn btn-primary">← Back to Staff List</button>
        </Link>
      </div>
    );
  }

  const roleColors = ROLE_COLORS[member.staffRole] || { bg: "var(--bg-secondary)", text: "#6366f1", border: "#6366f1" };

  // Parse attendance data
  const attendanceRecords = staffAttendance?.data || [];
  const presentCount = attendanceRecords.filter((a: any) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a: any) => a.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((a: any) => a.status === "LATE").length;
  const leaveCount = attendanceRecords.filter((a: any) => a.status === "LEAVE").length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

  // Parse salary history
  const salaryHistory = salaryHistoryData?.payroll || salaryHistoryData?.data || [];
  const currentSalary = member.salary || 0;

  // Parse login history
  const loginRecords = loginHistoryData?.data?.logs || loginHistoryData?.logs || [];

  // Parse activity
  const activityLogs = staffActionHistory?.data?.activityLogs || staffActionHistory?.data?.activities || [];
  const auditTrails = staffActionHistory?.data?.auditTrails || [];

  // Assigned orders
  const orders = assignedOrders?.data || assignedOrders || [];
  const pendingOrders = orders.filter((o: any) => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const completedOrders = orders.filter((o: any) => o.status === 'DELIVERED').length;

  const now = Date.now();
  const monthsServed = member.joiningDate
    ? Math.max(0, Math.floor((now - new Date(member.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : "—";
  const loginCount30d = loginRecords.filter(
    (l: any) => new Date(l.loginTime).getTime() > now - 30 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Back navigation */}
      <Link href="/dashboard/staff" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Staff Management
      </Link>

      {/* Profile Hero Card */}
      <div className="card" style={{ padding: 28, background: `linear-gradient(135deg, ${roleColors.bg}, var(--bg-card))` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: roleColors.bg,
            border: `3px solid ${roleColors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", fontWeight: 900, color: roleColors.text,
            flexShrink: 0,
          }}>
            {member.user.profilePicture ? (
              <img src={member.user.profilePicture} alt={member.user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              member.user.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name + Role + Status */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{member.user.name}</h1>
              <RoleBadge role={member.staffRole} />
              <StatusBadge active={member.isActive} />
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>Employee ID: <strong style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>{member.id.substring(0, 12).toUpperCase()}</strong></span>
              <span>Branch: <strong style={{ color: "var(--text-primary)" }}>{member.assignedBranch || "UCP Main Branch"}</strong></span>
              <span>Joined: <strong style={{ color: "var(--text-primary)" }}>{member.joiningDate || new Date(member.createdAt).toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwner && member.staffRole !== "OWNER" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tooltip content={member.isActive ? "Suspend — blocks login, sockets, dashboard, notifications" : "Activate — restores all access"} position="top">
                <button
                  onClick={handleToggleActive}
                  disabled={actionLoading === "toggle"}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                    border: `1px solid ${member.isActive ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
                    background: member.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                    color: member.isActive ? "#ef4444" : "#10b981",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {member.isActive ? <><ToggleLeft size={16} /> Suspend</> : <><ToggleRight size={16} /> Activate</>}
                </button>
              </Tooltip>
              <Tooltip content="Reset Password" position="top">
                <button
                  onClick={() => setShowResetPw(v => !v)}
                  style={{ padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", border: "1px solid rgba(217,119,6,0.4)", background: "rgba(217,119,6,0.1)", color: "#d97706", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Key size={16} /> Reset PW
                </button>
              </Tooltip>
              <Tooltip content="Duplicate Staff Profile" position="top">
                <button
                  onClick={handleDuplicate}
                  disabled={actionLoading === "duplicate"}
                  style={{ padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.1)", color: "#6366f1", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <UserPlus size={16} /> Duplicate
                </button>
              </Tooltip>
              <Tooltip content="Delete Staff Member" position="top">
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === "delete"}
                  style={{ padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </Tooltip>
            </div>
          )}

          {/* Reset Password Inline */}
          {showResetPw && (
            <form onSubmit={handleResetPassword} style={{ marginTop: 20, padding: 16, background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", maxWidth: 400 }}>
              <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Reset Password for {member.user.name}</h4>
              {pwDone ? (
                <div style={{ color: "#10b981", display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                  <CheckCircle size={18} /> Password reset successfully!
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    minLength={8}
                    required
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={actionLoading === "resetpw"}>
                    {actionLoading === "resetpw" ? "..." : "Reset"}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {[
          { id: "overview", label: "Overview", icon: <User size={16} /> },
          { id: "attendance", label: "Attendance", icon: <Calendar size={16} /> },
          { id: "salary", label: "Salary & Payroll", icon: <CreditCard size={16} /> },
          { id: "activity", label: "Activity & Audit", icon: <Activity size={16} /> },
          { id: "performance", label: "Performance", icon: <Target size={16} /> },
          { id: "orders", label: "Assigned Orders", icon: <Briefcase size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", border: "none",
              background: activeTab === tab.id ? "rgba(99,102,241,0.12)" : "transparent",
              color: activeTab === tab.id ? "#6366f1" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {/* Personal Information */}
          <SectionCard title="Personal Information" icon={<User size={16} />}>
            <InfoRow label="Full Name" value={member.user.name} icon={<User size={14} />} />
            <InfoRow label="Phone" value={member.user.phone} icon={<Phone size={14} />} />
            <InfoRow label="Email" value={member.user.email} icon={<Mail size={14} />} />
            <InfoRow label="CNIC" value={member.cnic || "Not provided"} icon={<FileText size={14} />} />
            <InfoRow label="Address" value={member.user.address || "Not provided"} icon={<MapPin size={14} />} />
            <InfoRow label="Emergency Contact" value={member.emergencyContact || "Not provided"} icon={<AlertTriangle size={14} />} />
          </SectionCard>

          {/* Employment Details */}
          <SectionCard title="Employment Details" icon={<Briefcase size={16} />}>
            <InfoRow label="Role" value={<RoleBadge role={member.staffRole} />} icon={<Shield size={14} />} />
            <InfoRow label="Department" value={member.department || "Operations"} icon={<Building size={14} />} />
            <InfoRow label="Work Shift" value={`${member.shift || "MORNING"} Shift`} icon={<Clock size={14} />} />
            <InfoRow label="Assigned Branch" value={member.assignedBranch || "UCP Main Branch"} icon={<MapPin size={14} />} />
            <InfoRow label="Joining Date" value={member.joiningDate || new Date(member.createdAt).toLocaleDateString()} icon={<Calendar size={14} />} />
            <InfoRow label="Added By" value={member.invitedBy?.name || "System Owner"} icon={<UserPlus size={14} />} />
          </SectionCard>

          {/* Compensation */}
          <SectionCard title="Compensation & Payroll" icon={<DollarSign size={16} />}>
            <InfoRow label="Monthly Salary" value={<span style={{ color: "#10b981", fontSize: "1.1rem", fontWeight: 800 }}>Rs. {currentSalary.toLocaleString()}</span>} icon={<DollarSign size={14} />} />
            <InfoRow label="Salary Grade" value={member.staffRole === "MANAGER" ? "Management Grade" : member.staffRole === "BRANCH_MANAGER" ? "Branch Management" : "Staff Grade"} />
            <div style={{ marginTop: 16, padding: 12, background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6 }}>ESTIMATED ANNUAL COST</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981" }}>Rs. {(currentSalary * 12).toLocaleString()}</div>
            </div>
          </SectionCard>

          {/* Access & Activity */}
          <SectionCard title="Access & Activity" icon={<Shield size={16} />}>
            <InfoRow label="Account Status" value={
              <span style={{ color: member.isActive ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                {member.isActive ? "✓ Active — Can login" : "✗ Suspended — Access blocked"}
              </span>
            } icon={<Shield size={14} />} />
            <InfoRow label="Last Login" value={member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never logged in"} icon={<Activity size={14} />} />
            <InfoRow label="Account Created" value={new Date(member.createdAt).toLocaleString()} icon={<Calendar size={14} />} />
            <InfoRow label="Active Permissions" value={`${member.permissions?.length || 0} system permissions`} icon={<Award size={14} />} />
          </SectionCard>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Attendance Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <MetricCard label="Total Records" value={attendanceRecords.length} color="#6366f1" icon={<Calendar size={20} />} />
            <MetricCard label="Present" value={presentCount} color="#10b981" icon={<CheckCircle size={20} />} />
            <MetricCard label="Absent" value={absentCount} color="#ef4444" icon={<AlertTriangle size={20} />} />
            <MetricCard label="Late" value={lateCount} color="#d97706" icon={<Clock size={20} />} />
            <MetricCard label="On Leave" value={leaveCount} color="#3b82f6" icon={<HeartPulse size={20} />} />
            <MetricCard label="Attendance Rate" value={`${attendanceRate}%`} color={attendanceRate >= 90 ? "#10b981" : attendanceRate >= 70 ? "#d97706" : "#ef4444"} icon={<Target size={20} />} />
          </div>

          {/* Attendance Table */}
          <SectionCard title="Attendance Records">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px" }}>Clock In</th>
                    <th style={{ padding: "12px 16px" }}>Clock Out</th>
                    <th style={{ padding: "12px 16px" }}>Hours Worked</th>
                    <th style={{ padding: "12px 16px" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <Calendar size={24} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No attendance records found. Records will appear here as staff clock in/out.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((record: any, idx: number) => (
                      <tr key={record.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>{new Date(record.date).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700,
                            background: record.status === "PRESENT" ? "rgba(16,185,129,0.12)" :
                                      record.status === "ABSENT" ? "rgba(239,68,68,0.12)" :
                                      record.status === "LATE" ? "rgba(217,119,6,0.12)" : "rgba(59,130,246,0.12)",
                            color: record.status === "PRESENT" ? "#10b981" :
                                   record.status === "ABSENT" ? "#ef4444" :
                                   record.status === "LATE" ? "#d97706" : "#3b82f6",
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{record.hoursWorked || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>{record.notes || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* SALARY & PAYROLL TAB */}
      {activeTab === "salary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard title="Current Salary" icon={<CreditCard size={16} />}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <MetricCard label="Base Monthly Salary" value={`Rs. ${currentSalary.toLocaleString()}`} color="#10b981" icon={<DollarSign size={20} />} />
              <MetricCard label="Annual CTC" value={`Rs. ${(currentSalary * 12).toLocaleString()}`} color="#6366f1" icon={<CreditCard size={20} />} />
              <MetricCard label="Shift" value={member.shift || "MORNING"} color="#d97706" icon={<Clock size={20} />} />
              <MetricCard label="Department" value={member.department || "Operations"} color="#3b82f6" icon={<Building size={20} />} />
            </div>
          </SectionCard>

          {/* Salary History */}
          <SectionCard title="Salary History & Adjustments">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "12px 16px" }}>Previous Salary</th>
                    <th style={{ padding: "12px 16px" }}>New Salary</th>
                    <th style={{ padding: "12px 16px" }}>Approved By</th>
                    <th style={{ padding: "12px 16px" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <CreditCard size={24} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No salary history records. Salary changes will appear here.
                      </td>
                    </tr>
                  ) : (
                    salaryHistory.map((h: any, idx: number) => (
                      <tr key={h.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>{new Date(h.date || h.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "3px 8px", borderRadius: 12, fontSize: "0.7rem", fontWeight: 700,
                            background: h.type === "RAISE" ? "rgba(16,185,129,0.15)" :
                                      h.type === "BONUS" ? "rgba(99,102,241,0.15)" :
                                      h.type === "DEDUCTION" ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)",
                            color: h.type === "RAISE" ? "#10b981" :
                                   h.type === "BONUS" ? "#6366f1" :
                                   h.type === "DEDUCTION" ? "#ef4444" : "#8b5cf6",
                          }}>
                            {h.type}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: h.type === "DEDUCTION" ? "#ef4444" : "#10b981" }}>
                          {h.type === "DEDUCTION" ? "-" : "+"} Rs. {Math.abs(h.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px" }}>Rs. {(h.previousSalary || 0).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>Rs. {(h.newSalary || 0).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{h.approvedBy || "System"}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>{h.notes || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Monthly Payroll */}
          {salaryHistoryData?.data?.payroll && (
            <SectionCard title="Monthly Payroll Records">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 16px" }}>Month</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Base Salary</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Days Present</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Prorated Salary</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistoryData.data.payroll.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.month}/{p.year}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>Rs. {p.baseSalary?.toLocaleString() || 0}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>{p.daysPresent}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6366f1" }}>Rs. {p.proratedSalary?.toLocaleString() || 0}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#10b981" }}>Rs. {p.totalPaid?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ACTIVITY & AUDIT TAB */}
      {activeTab === "activity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard title="System Activity Log">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Timestamp</th>
                    <th style={{ padding: "12px 16px" }}>Action</th>
                    <th style={{ padding: "12px 16px" }}>Module</th>
                    <th style={{ padding: "12px 16px" }}>Details</th>
                    <th style={{ padding: "12px 16px" }}>IP / Device</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <Activity size={24} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No activity logs yet.
                      </td>
                    </tr>
                  ) : (
                    activityLogs.slice(0, 50).map((log: any, idx: number) => (
                      <tr key={log.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#6366f1" }}>{log.action}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "0.7rem", background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                            {log.module || "System"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>{log.details || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem" }}>{log.ip || "—"} / {log.device || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Order Audit Trail">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Timestamp</th>
                    <th style={{ padding: "12px 16px" }}>Order #</th>
                    <th style={{ padding: "12px 16px" }}>Action</th>
                    <th style={{ padding: "12px 16px" }}>Previous Status</th>
                    <th style={{ padding: "12px 16px" }}>New Status</th>
                    <th style={{ padding: "12px 16px" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrails.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <History size={24} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No audit trails for this staff member.
                      </td>
                    </tr>
                  ) : (
                    auditTrails.slice(0, 50).map((trail: any, idx: number) => (
                      <tr key={trail.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{new Date(trail.createdAt).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, fontFamily: "monospace" }}>{trail.order?.orderNumber || trail.orderId}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 10, fontSize: "0.7rem", fontWeight: 700,
                            background: trail.isOverride ? "rgba(217,119,6,0.15)" : "rgba(99,102,241,0.12)",
                            color: trail.isOverride ? "#d97706" : "#6366f1",
                          }}>
                            {trail.action}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{trail.previousStatus || "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#10b981" }}>{trail.newStatus || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>{trail.note || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Login History">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Login Time</th>
                    <th style={{ padding: "12px 16px" }}>Logout Time</th>
                    <th style={{ padding: "12px 16px" }}>Duration</th>
                    <th style={{ padding: "12px 16px" }}>Device</th>
                    <th style={{ padding: "12px 16px" }}>Browser</th>
                    <th style={{ padding: "12px 16px" }}>IP / Location</th>
                  </tr>
                </thead>
                <tbody>
                  {loginRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <LogIn size={24} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No login history available.
                      </td>
                    </tr>
                  ) : (
                    loginRecords.slice(0, 50).map((log: any, idx: number) => {
                      const duration = log.logoutTime ? 
                        Math.round((new Date(log.logoutTime).getTime() - new Date(log.loginTime).getTime()) / 60000) + " min" :
                        "Active";
                      return (
                        <tr key={log.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{new Date(log.loginTime).toLocaleString()}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : "—"}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{duration}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>{log.device || "Unknown"}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>{log.browser || "Unknown"}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem" }}>{log.ip || "—"} / {log.location || "—"}</td>
                        </tr>
                      );
                    }
                  )
                )
              }
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {activeTab === "performance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard title="Performance Metrics">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <MetricCard label="Orders Handled" value={orders.length} color="#6366f1" icon={<Briefcase size={20} />} />
              <MetricCard label="Completed" value={completedOrders} color="#10b981" icon={<CheckCircle size={20} />} />
              <MetricCard label="Pending" value={pendingOrders} color="#d97706" icon={<Clock size={20} />} />
              <MetricCard label="Attendance Rate" value={`${attendanceRate}%`} color={attendanceRate >= 90 ? "#10b981" : attendanceRate >= 70 ? "#d97706" : "#ef4444"} icon={<Target size={20} />} />
              <MetricCard label="Months Served" value={monthsServed} color="#3b82f6" icon={<Calendar size={20} />} />
              <MetricCard label="Login Count (30d)" value={loginCount30d} color="#8b5cf6" icon={<LogIn size={20} />} />
            </div>
          </SectionCard>

          <SectionCard title="Monthly Performance Trend">
            <div style={{ height: 200, background: "var(--bg-secondary)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
              <BarChart2 size={32} style={{ opacity: 0.3 }} />
              <span style={{ marginLeft: 8 }}>Chart: Orders handled per month (connect to analytics endpoint)</span>
            </div>
          </SectionCard>

          <SectionCard title="Key Achievements">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.15)" }}>
                <Award size={20} color="#6366f1" />
                <div>
                  <div style={{ fontWeight: 600 }}>Consistent Attendance</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{attendanceRate}% attendance rate this period</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.15)" }}>
                <CheckCircle size={20} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 600 }}>Order Completion</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{completedOrders} orders completed successfully</div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ASSIGNED ORDERS TAB */}
      {activeTab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard title="Assigned Orders">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Order #</th>
                    <th style={{ padding: "12px 16px" }}>Customer</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "12px 16px" }}>Placed</th>
                    <th style={{ padding: "12px 16px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <Briefcase size={24} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                        No orders assigned to this staff member.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, fontFamily: "monospace" }}>{order.orderNumber}</td>
                        <td style={{ padding: "12px 16px" }}>{order.customer?.name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "3px 8px", borderRadius: 12, fontSize: "0.7rem", fontWeight: 700,
                            background: order.status === "DELIVERED" ? "rgba(16,185,129,0.12)" :
                                      order.status === "CANCELLED" ? "rgba(239,68,68,0.12)" :
                                      "rgba(99,102,241,0.12)",
                            color: order.status === "DELIVERED" ? "#10b981" :
                                   order.status === "CANCELLED" ? "#ef4444" : "#6366f1",
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Rs. {order.total?.toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{new Date(order.placedAt).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>View</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Permissions Matrix */}
      <SectionCard title="Assigned System Permissions">
        {member.permissions?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {member.permissions.map((p: string) => (
              <span key={p} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle size={12} /> {p.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-secondary)" }}>
            <Shield size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No specific permissions assigned. Using role defaults.</p>
          </div>
        )}
      </SectionCard>

      {/* Notes */}
      {member.notes && (
        <SectionCard title="Manager Notes">
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.7, margin: 0 }}>{member.notes}</p>
        </SectionCard>
      )}
    </div>
  );
}