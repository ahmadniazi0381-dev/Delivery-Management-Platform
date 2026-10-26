"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DollarSign, Users, TrendingUp, Calendar, Download, RefreshCw,
  ChevronLeft, ChevronRight, Edit3, CheckCircle, X, Clock,
  Briefcase, Award, Filter, Search, FileText, BarChart2, CreditCard,
  ArrowUpRight, ArrowDownRight, AlertCircle, Star
} from "lucide-react";
import { useAdminQuery, adminFetch } from "./hooks/useAdminApi";
import { SkeletonStat, SkeletonTable } from "./components/SkeletonLoader";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StaffSalaryEntry {
  staffId: string;
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  shift: string;
  department: string;
  baseSalary: number;
  proratedSalary: number;
  daysPresent: number;
  isNewJoiner: boolean;
  joiningDate: string | null;
}

interface SalaryOverviewItem {
  id: string;
  staffRole: string;
  salary: number | null;
  shift: string | null;
  department: string | null;
  joiningDate: string | null;
  lastLoginAt: string | null;
  monthsServed: number | null;
  user: { id: string; name: string; email: string | null; phone: string | null; profilePicture: string | null };
}

// ─── Role colour system ──────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OWNER:          { bg: "rgba(217,119,6,0.12)",  text: "#d97706", border: "#d97706" },
  MANAGER:        { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "#6366f1" },
  CASHIER:        { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "#10b981" },
  KDS:            { bg: "rgba(236,72,153,0.12)", text: "#ec4899", border: "#ec4899" },
  RIDER_MANAGER:  { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "#3b82f6" },
  BRANCH_MANAGER: { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "#8b5cf6" },
};

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] || { bg: "var(--bg-secondary)", text: "var(--text-secondary)", border: "var(--border)" };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {role.replace("_", " ")}
    </span>
  );
}

// ─── Edit Salary Modal ───────────────────────────────────────────────────────

function EditSalaryModal({
  member,
  onClose,
  onSaved,
}: {
  member: SalaryOverviewItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    salary: member.salary ? String(member.salary) : "",
    shift: member.shift || "MORNING",
    department: member.department || "Operations",
    joiningDate: member.joiningDate ? new Date(member.joiningDate).toISOString().split("T")[0] : "",
    assignedBranch: "UCP Main Branch, Johar Town Lahore",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminFetch(`/api/owner/salary/${member.id}`, {
        method: "PUT",
        body: JSON.stringify({
          salary: form.salary ? parseFloat(form.salary) : null,
          shift: form.shift,
          department: form.department,
          joiningDate: form.joiningDate || null,
          assignedBranch: form.assignedBranch,
        }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 480, padding: 28, border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>
            ✏️ Edit Compensation — {member.user.name}
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Monthly Salary (PKR) *</label>
            <input
              className="form-input"
              type="number"
              value={form.salary}
              onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
              placeholder="e.g. 55000"
              required
            />
          </div>
          <div>
            <label className="form-label">Work Shift</label>
            <select className="form-input" value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
              <option value="MORNING">Morning (8AM – 4PM)</option>
              <option value="EVENING">Evening (4PM – 12AM)</option>
              <option value="NIGHT">Night (12AM – 8AM)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Department</label>
            <input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Operations" />
          </div>
          <div>
            <label className="form-label">Joining Date</label>
            <input className="form-input" type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Assigned Branch</label>
            <input className="form-input" value={form.assignedBranch} onChange={e => setForm(f => ({ ...f, assignedBranch: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Compensation"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Salary Slip Modal ───────────────────────────────────────────────────────

function SalarySlipModal({
  entry,
  year,
  month,
  onClose,
}: {
  entry: StaffSalaryEntry;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
  const bonus = entry.role === "MANAGER" ? Math.round(entry.baseSalary * 0.05) : 0;
  const deductions = Math.round(entry.baseSalary * 0.02); // 2% EOBI/PESSI
  const netSalary = entry.proratedSalary + bonus - deductions;

  const handlePrint = () => window.print();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto", border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        {/* Slip Header */}
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", padding: "24px 28px", borderRadius: "16px 16px 0 0", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Salary Slip</h2>
              <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "0.9rem" }}>Delivery Platform</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: 600 }}>{monthName} {year}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Employee Info */}
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.85rem" }}>
              <div><span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Employee Name: </span><strong>{entry.name}</strong></div>
              <div><span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Role: </span><strong>{entry.role.replace("_", " ")}</strong></div>
              <div><span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Department: </span><strong>{entry.department}</strong></div>
              <div><span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Shift: </span><strong>{entry.shift}</strong></div>
              <div><span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Phone: </span><strong>{entry.phone || "N/A"}</strong></div>
              <div><span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Days Present: </span><strong>{entry.daysPresent}</strong></div>
            </div>
          </div>

          {/* Earnings */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Earnings</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Basic Salary", amount: entry.baseSalary },
                ...(entry.isNewJoiner ? [{ label: "Prorated (New Joiner)", amount: entry.proratedSalary - entry.baseSalary }] : []),
                ...(bonus > 0 ? [{ label: "Performance Bonus (5%)", amount: bonus }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>Rs. {row.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deductions</h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>EOBI / PESSI (2%)</span>
              <span style={{ fontWeight: 700, color: "#ef4444" }}>- Rs. {deductions.toLocaleString()}</span>
            </div>
          </div>

          {/* Net */}
          <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))", border: "2px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>NET PAYABLE SALARY</span>
              <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#6366f1" }}>Rs. {netSalary.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} /> Print Slip
            </button>
            <button onClick={onClose} className="btn btn-primary">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminSalary() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editingMember, setEditingMember] = useState<SalaryOverviewItem | null>(null);
  const [viewingSlip, setViewingSlip] = useState<StaffSalaryEntry | null>(null);

  const { data: overviewData, loading: overviewLoading, refetch: refetchOverview } =
    useAdminQuery<{ staff: SalaryOverviewItem[]; totalPayroll: number; totalStaff: number; byRole: Record<string, any> }>("/api/owner/salary", []);

  const { data: payrollData, loading: payrollLoading, refetch: refetchPayroll } =
    useAdminQuery<{ payroll: StaffSalaryEntry[]; totalPayroll: number; staffCount: number; year: number; month: number }>(
      `/api/owner/salary/month/${year}/${month}`,
      [year, month]
    );

  const refetchAll = useCallback(() => {
    refetchOverview();
    refetchPayroll();
  }, [refetchOverview, refetchPayroll]);

  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });

  const staffList = overviewData?.staff || [];
  const payroll = payrollData?.payroll || [];
  const totalPayroll = overviewData?.totalPayroll || 0;
  const byRole = overviewData?.byRole || {};

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchSearch = !search ||
        s.user.name.toLowerCase().includes(search.toLowerCase()) ||
        s.user.phone?.includes(search) ||
        s.user.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "ALL" || s.staffRole === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staffList, search, roleFilter]);

  const handleExportCSV = () => {
    const headers = ["Name", "Role", "Department", "Shift", "Monthly Salary", "Joining Date", "Months Served"];
    const rows = filteredStaff.map(s => [
      `"${s.user.name}"`,
      s.staffRole,
      s.department || "Operations",
      s.shift || "MORNING",
      s.salary || 0,
      s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : "N/A",
      s.monthsServed ?? 0,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `salary_export_${year}_${month}.csv`;
    a.click();
  };

  const navMonth = (dir: -1 | 1) => {
    let nm = month + dir;
    let ny = year;
    if (nm < 1) { nm = 12; ny--; }
    if (nm > 12) { nm = 1; ny++; }
    setMonth(nm);
    setYear(ny);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <DollarSign color="#10b981" size={28} /> Salary & Payroll Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Manage staff compensation, generate payroll slips, and track monthly salary disbursements.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={refetchAll} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {overviewLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="card" style={{ padding: 20, height: 80 }} />)
        ) : [
          { label: "Total Monthly Payroll", value: `Rs. ${totalPayroll.toLocaleString()}`, icon: DollarSign, color: "#10b981" },
          { label: "Total Staff Members", value: overviewData?.totalStaff || 0, icon: Users, color: "#6366f1" },
          { label: "Managers", value: byRole["MANAGER"]?.count || 0, icon: Award, color: "#d97706" },
          { label: "Avg. Salary", value: `Rs. ${overviewData?.totalStaff ? Math.round(totalPayroll / overviewData.totalStaff).toLocaleString() : 0}`, icon: TrendingUp, color: "#3b82f6" },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Payroll Navigator */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color="#6366f1" /> Monthly Payroll — {monthName} {year}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => navMonth(-1)} className="btn btn-secondary" style={{ padding: "6px 10px" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 700, minWidth: 120, textAlign: "center", fontSize: "0.9rem" }}>{monthName} {year}</span>
            <button onClick={() => navMonth(1)} className="btn btn-secondary" style={{ padding: "6px 10px" }} disabled={year === now.getFullYear() && month === now.getMonth() + 1}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {payrollLoading ? (
          <SkeletonTable rows={4} cols={6} />
        ) : payroll.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            <AlertCircle size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p>No active staff found for payroll generation.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Employee</th>
                    <th style={{ padding: "12px 12px", textAlign: "left" }}>Role</th>
                    <th style={{ padding: "12px 12px", textAlign: "left" }}>Dept / Shift</th>
                    <th style={{ padding: "12px 12px", textAlign: "right" }}>Base Salary</th>
                    <th style={{ padding: "12px 12px", textAlign: "right" }}>Payable</th>
                    <th style={{ padding: "12px 12px", textAlign: "center" }}>Days Present</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(entry => (
                    <tr key={entry.staffId} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{entry.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{entry.phone || entry.email || "–"}</div>
                      </td>
                      <td style={{ padding: "14px 12px" }}><RoleBadge role={entry.role} /></td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ fontSize: "0.82rem" }}>{entry.department}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{entry.shift}</div>
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 700 }}>
                        Rs. {entry.baseSalary.toLocaleString()}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 800, color: "#10b981" }}>
                        Rs. {entry.proratedSalary.toLocaleString()}
                        {entry.isNewJoiner && <div style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: 600 }}>Prorated</div>}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "center" }}>
                        <span style={{ background: entry.daysPresent >= 20 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: entry.daysPresent >= 20 ? "#10b981" : "#d97706", padding: "3px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700 }}>
                          {entry.daysPresent} days
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setViewingSlip(entry)}
                          className="btn btn-secondary"
                          style={{ padding: "5px 12px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <FileText size={12} /> View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "rgba(99,102,241,0.06)", borderTop: "2px solid rgba(99,102,241,0.2)" }}>
                    <td colSpan={4} style={{ padding: "14px 16px", fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                      Total Monthly Payroll — {monthName} {year}
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 900, color: "#6366f1", fontSize: "1.05rem" }}>
                      Rs. {(payrollData?.totalPayroll || 0).toLocaleString()}
                    </td>
                    <td colSpan={2} style={{ padding: "14px 16px" }} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Staff Salary Overview (edit mode) */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={18} color="#6366f1" /> Compensation Register
          </h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--text-secondary)" }} />
              <input
                className="form-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff..."
                style={{ paddingLeft: 32, width: 200 }}
              />
            </div>
            <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 150 }}>
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="KDS">KDS Staff</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
            </select>
          </div>
        </div>

        {overviewLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filteredStaff.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p>No staff members found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Staff Member</th>
                  <th style={{ padding: "12px 12px", textAlign: "left" }}>Role & Dept</th>
                  <th style={{ padding: "12px 12px", textAlign: "left" }}>Shift</th>
                  <th style={{ padding: "12px 12px", textAlign: "right" }}>Monthly Salary</th>
                  <th style={{ padding: "12px 12px", textAlign: "center" }}>Tenure</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(member => (
                  <tr key={member.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: ROLE_COLORS[member.staffRole]?.bg || "var(--bg-secondary)", color: ROLE_COLORS[member.staffRole]?.text || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{member.user.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{member.user.phone || member.user.email || "–"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <RoleBadge role={member.staffRole} />
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>{member.department || "Operations"}</div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>{member.shift || "MORNING"}</span>
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "right" }}>
                      {member.salary !== null && member.salary !== undefined ? (
                        <span style={{ fontWeight: 800, color: "#10b981", fontSize: "1rem" }}>
                          Rs. {member.salary.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 600 }}>Not Set</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      {member.monthsServed !== null ? (
                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {member.monthsServed}mo
                        </span>
                      ) : "–"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setEditingMember(member)}
                        style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)", cursor: "pointer", color: "#6366f1", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingMember && (
        <EditSalaryModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={refetchAll}
        />
      )}
      {viewingSlip && (
        <SalarySlipModal
          entry={viewingSlip}
          year={year}
          month={month}
          onClose={() => setViewingSlip(null)}
        />
      )}
    </div>
  );
}
