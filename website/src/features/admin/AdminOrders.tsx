"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  User,
  Phone,
  Printer,
  Zap,
  Inbox,
  AlertCircle
} from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/AdminToast";

const STATUS_FLOW = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED"
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--saffron)", // amber
  ACCEPTED: "#3B82F6", // blue
  PREPARING: "#8B5CF6", // purple
  READY: "#14B8A6", // teal
  OUT_FOR_DELIVERY: "#EA580C", // orange
  DELIVERED: "#10B981", // green
  CANCELLED: "#6B7280", // gray
  REJECTED: "#6B7280", // gray
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [riders, setRiders] = useState<any[]>([]);
  const [assigningRiderId, setAssigningRiderId] = useState<string>("");
  const [liveFlash, setLiveFlash] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  
  // Date range filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const printRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
          setIsOffline(false);
        } else if (Array.isArray(data)) {
          setOrders(data);
          setIsOffline(false);
        }
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRiders = useCallback(async () => {
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/riders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setRiders(data.data);
      }
    } catch {}
  }, []);

  const fetchOrderDetail = useCallback(async (id: string) => {
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setDetailedOrder(data.data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchRiders();
  }, [fetchOrders, fetchRiders]);

  useEffect(() => {
    if (selectedOrder?.id) {
      fetchOrderDetail(selectedOrder.id);
    } else {
      setDetailedOrder(null);
    }
  }, [selectedOrder, fetchOrderDetail]);

  // ── Live socket updates (REQ-ORDER-ALERT-001 dashboard update) ────────────
  useEffect(() => {
    if (!socket) return;

    const flashAndRefresh = () => {
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 600);
      fetchOrders();
    };

    // New order → prepend to list (optimistic), then sync
    const handleNewOrder = (data: any) => {
      flashAndRefresh();
      setActiveTab("PENDING"); // Auto-focus pending tab on new order
    };

    // Order updated by ANY admin → update status in list without reload
    const handleOrderUpdate = (data: { orderId: string; status: string }) => {
      setOrders((prev) =>
        prev.map((o) => o.id === data.orderId ? { ...o, status: data.status } : o)
      );
      if (selectedOrder?.id === data.orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: data.status } : prev);
      }
      flashAndRefresh();
    };

    socket.on("order:new",       handleNewOrder);
    socket.on("order:updated",   handleOrderUpdate);
    socket.on("order:accepted",  handleOrderUpdate);
    socket.on("order:rejected",  handleOrderUpdate);
    socket.on("order:cancelled", handleOrderUpdate);

    return () => {
      socket.off("order:new",       handleNewOrder);
      socket.off("order:updated",   handleOrderUpdate);
      socket.off("order:accepted",  handleOrderUpdate);
      socket.off("order:rejected",  handleOrderUpdate);
      socket.off("order:cancelled", handleOrderUpdate);
    };
  }, [socket, fetchOrders, selectedOrder]);

  const updateStatus = async (orderId: string, newStatus: string, riderId?: string) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((ord) => ord.id === orderId ? { ...ord, status: newStatus, riderId: riderId || ord.riderId } : ord)
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus, riderId: riderId || prev?.riderId }));
    }

    if (isOffline) return;

    const token = localStorage.getItem("naseeb_token");
    try {
      // Route to the correct endpoint based on the target status
      let url: string;
      const method = 'PUT';
      let body: object = {};

      if (newStatus === "ACCEPTED") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${orderId}/accept`;
        body = {};
      } else if (newStatus === "REJECTED") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${orderId}/reject`;
        body = { reason: rejectReason || "Rejected by manager" };
      } else if (newStatus === "CANCELLED") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${orderId}/status`;
        body = { status: newStatus };
      } else {
        // PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED
        url = `${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${orderId}/status`;
        body = { status: newStatus, ...(riderId ? { riderId } : {}) };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        addToast({ type: "error", title: "Update Failed", message: errJson.error || errJson.message || `HTTP ${res.status}` });
        fetchOrders(); // Revert optimistic update
      }
    } catch {
      addToast({ type: "error", title: "Network Error", message: "Failed to reach server." });
      fetchOrders();
    }
  };


  const handleAssignRider = () => {
    if (!assigningRiderId || !selectedOrder) return;
    updateStatus(selectedOrder.id, "READY", assigningRiderId);
    setAssigningRiderId("");
  };

  const handleSaveNotes = async (notesText: string) => {
    if (!selectedOrder?.id) return;
    setNotesSaving(true);
    const token = localStorage.getItem("naseeb_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${selectedOrder.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ internalNotes: notesText })
      });
      if (res.ok) {
        addToast({ type: "success", title: "Notes Saved", message: "Internal staff notes updated." });
        setDetailedOrder((prev: any) => prev ? { ...prev, internalNotes: notesText } : prev);
      } else {
        addToast({ type: "error", title: "Save Failed", message: "Failed to update order notes." });
      }
    } catch {
      addToast({ type: "error", title: "Save Failed", message: "Network connection error." });
    } finally {
      setNotesSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const win = window.open("", "_blank");
      win?.document.write(`
        <html>
          <head>
            <title>Invoice - ${selectedOrder.id}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; line-height: 1.4; color: #333; }
              .invoice-header { border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 15px; }
              .item-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .item-table th, .item-table td { padding: 8px 0; border-bottom: 1px dashed #eee; text-align: left; }
              .total-section { text-align: right; margin-top: 15px; border-top: 2px dashed #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      win?.document.close();
      win?.print();
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (o.status !== activeTab) return false;
    
    if (startDate) {
      const orderDate = new Date(o.placedAt);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (orderDate < start) return false;
    }
    
    if (endDate) {
      const orderDate = new Date(o.placedAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }
    
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
      <style>{`
        @keyframes live-flash { 0%{opacity:1}50%{opacity:0.3}100%{opacity:1} }
        @keyframes slide-in { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes amber-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.6); } 50% { box-shadow: 0 0 0 6px rgba(234,88,12,0); } }
        .live-flash { animation: live-flash 0.4s ease; }
        .animate-scale-in { animation: slide-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .amber-pulse { animation: amber-pulse 1.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        
        .warm-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.3);
          border-color: #EA580C !important;
        }

        .double-bezel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle, rgba(0,0,0,0.05));
          border-radius: var(--radius-xl);
          padding: 6px;
        }
        
        .double-bezel-inner {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .order-card-pending {
          border-left: 4px solid #EA580C !important;
          background: linear-gradient(90deg, rgba(234, 88, 12, 0.05) 0%, transparent 100%) !important;
        }

        .btn-accept {
          background: linear-gradient(135deg, #EA580C, #9A3412);
          color: white;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: transform var(--transition-fast) cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: var(--shadow-md);
        }
        .btn-accept:hover {
          transform: translateY(-2px);
        }
        .btn-accept:active {
          transform: translateY(0);
        }
        .btn-accept .inner-btn {
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-reject {
          background: var(--error, #EF4444);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: transform var(--transition-fast) cubic-bezier(0.22, 1, 0.36, 1);
        }
        .btn-reject:hover {
          transform: translateY(-2px);
        }
        .btn-reject:active {
          transform: scale(0.96);
        }
      `}</style>

      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Orders Pipeline</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Real-time order management — no refresh needed.
          </p>
        </div>
        <span
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "0.8rem", color: "#10b981",
            background: "rgba(16,185,129,0.1)",
            padding: "4px 10px", borderRadius: "20px", fontWeight: 600,
          }}
          className={liveFlash ? "live-flash" : ""}
        >
          <Zap size={12} /> LIVE
        </span>
      </div>

      {isOffline && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 16px", fontSize: "0.85rem", color: "var(--saffron)", fontWeight: 500 }}>
          ⚠️ Running in Sandbox Mode — changes are local only.
        </div>
      )}

      {/* Filter and Tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Filter Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="warm-input"
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", transition: "all var(--transition-fast)" }}
          />
          <span style={{ color: "var(--text-secondary)" }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="warm-input"
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", transition: "all var(--transition-fast)" }}
          />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Clear</button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {STATUS_FLOW.map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            const isPending = status === "PENDING" && count > 0;
            const isActive = activeTab === status;
            
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={isPending ? "amber-pulse" : ""}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: isActive && !isPending ? "1px solid #EA580C" : "1px solid transparent",
                  background: isActive
                    ? isPending ? "#EA580C" : "rgba(234, 88, 12, 0.1)"
                    : "var(--bg-secondary)",
                  color: isActive ? (isPending ? "#fff" : "#EA580C") : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
              {status.replace(/_/g, ' ')}
              <span style={{ fontSize: "0.75rem", background: isActive && isPending ? "rgba(0,0,0,0.2)" : "rgba(234, 88, 12, 0.2)", color: isActive && isPending ? "#fff" : "#EA580C", padding: "2px 8px", borderRadius: "10px" }}>
                {count}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "min(45vw, 520px) 1fr" : "1fr", gap: "24px" }} className="orders-split-grid">
        {/* Orders List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="double-bezel">
                <div className="double-bezel-inner skeleton" style={{ height: "120px", borderRadius: "var(--radius-lg)" }} />
              </div>
            ))
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="double-bezel animate-scale-in"
                style={{
                  borderColor: selectedOrder?.id === order.id ? "#EA580C" : "var(--border-subtle)",
                  cursor: "pointer",
                  transition: "border-color var(--transition-fast)",
                }}
              >
                <div 
                  className={`double-bezel-inner ${order.status === 'PENDING' ? 'order-card-pending' : ''}`}
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>#{order.id}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    <div>👤 {order.customer?.name || "Customer"} ({order.customer?.phone})</div>
                    <div style={{ marginTop: "4px" }}>📍 {order.address?.addressLine || "No Address Line"}</div>
                  </div>
                  <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {order.orderItems?.length || 0} items · {order.paymentMethod}
                    </span>
                    <span style={{ fontWeight: 800, color: "#EA580C" }}>Rs. {order.total}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", background: "var(--bg-secondary)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--border-color)" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(234, 88, 12, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EA580C", marginBottom: "16px" }}>
                <Inbox size={32} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>No orders in this status</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "250px" }}>
                When new orders arrive for {activeTab.replace(/_/g, ' ')}, they will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div className="double-bezel fade-in" style={{ alignSelf: "flex-start" }}>
            <div className="double-bezel-inner" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", background: "var(--bg-card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Order #{selectedOrder.id}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: "6px" }} title="Print Invoice">
                    <Printer size={16} />
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                    Close
                  </button>
                </div>
              </div>

              {/* Hidden print stub */}
              <div style={{ display: "none" }}>
                <div ref={printRef}>
                  <div className="invoice-header" style={{ textAlign: "center" }}>
                    <h2>Delivery Platform</h2>
                    <p>Shop #15, Near UCP, Khayaban-e-Jinnah, Johar Town, Lahore</p>
                    <p>Owner: Muhammad Abdullah | Phone: +92 305 4311118</p>
                    <p><strong>Order ID: {selectedOrder.id}</strong></p>
                    <p>Date: {new Date(selectedOrder.placedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Customer:</strong> {selectedOrder.customer?.name} ({selectedOrder.customer?.phone})</p>
                    <p><strong>Delivery Address:</strong> {selectedOrder.address?.addressLine}</p>
                    <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                  </div>
                  <table className="item-table">
                    <thead>
                      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {selectedOrder.orderItems?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td>Rs. {item.unitPrice}</td>
                          <td>Rs. {item.quantity * item.unitPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="total-section">
                    <p>Subtotal: Rs. {selectedOrder.subtotal}</p>
                    {selectedOrder.discountAmount > 0 && <p>Discount: -Rs. {selectedOrder.discountAmount}</p>}
                    <p>Delivery Fee: Rs. {selectedOrder.deliveryCharge}</p>
                    <h3>Grand Total: Rs. {selectedOrder.total}</h3>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong>Status:</strong> 
                  <span style={{ 
                    fontWeight: 700, 
                    color: STATUS_COLORS[selectedOrder.status] || "var(--text-primary)",
                    background: `${STATUS_COLORS[selectedOrder.status]}20` || "var(--bg-secondary)",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem"
                  }}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div><strong>Payment:</strong> {selectedOrder.paymentMethod}</div>
                <div><strong>Customer:</strong> {selectedOrder.customer?.name}</div>
                <div><strong>Phone:</strong> {selectedOrder.customer?.phone}</div>
                <div><strong>Address:</strong> {selectedOrder.address?.addressLine}</div>
              </div>

              {/* Items table */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "10px" }}>Item Name</th>
                      <th style={{ padding: "10px", width: "80px", textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "10px", width: "100px", textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                        <td style={{ padding: "10px", color: "var(--text-primary)" }}>{item.itemName}</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "var(--text-primary)" }}>{item.quantity}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>Rs. {item.quantity * item.unitPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order total summary */}
              <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "12px 16px", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>Rs. {selectedOrder.subtotal}</span></div>
                {selectedOrder.discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}><span>Discount</span><span>-Rs. {selectedOrder.discountAmount}</span></div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery</span><span>Rs. {selectedOrder.deliveryCharge}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem", borderTop: "1px dashed var(--border-color)", paddingTop: "8px", marginTop: "4px" }}>
                  <span>Grand Total</span><span style={{ color: "#EA580C" }}>Rs. {selectedOrder.total}</span>
                </div>
              </div>

              {/* Internal Staff Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Internal Dispatcher Notes</label>
                <textarea
                  key={selectedOrder.id}
                  rows={3}
                  placeholder="e.g. Leave with security guard, call customer when outside..."
                  defaultValue={detailedOrder?.internalNotes || ""}
                  onBlur={(e) => handleSaveNotes(e.target.value)}
                  className="warm-input"
                  style={{
                    padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)", color: "var(--text-primary)",
                    fontFamily: "inherit", fontSize: "0.85rem", resize: "vertical",
                    transition: "all var(--transition-fast)"
                  }}
                />
                {notesSaving && <span style={{ fontSize: "0.75rem", color: "#EA580C" }}>Saving notes...</span>}
              </div>

              {/* Workflow Buttons */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {selectedOrder.status === "PENDING" && (
                  <>
                    <button onClick={() => updateStatus(selectedOrder.id, "ACCEPTED")} className="btn-accept" style={{ flexGrow: 1 }}>
                      <div className="inner-btn"><CheckCircle2 size={16} /></div>
                      Accept Order
                    </button>
                    <button onClick={() => setRejectModalOpen(true)} className="btn-reject" style={{ flexGrow: 1, padding: "12px" }}>
                      ✕ Reject
                    </button>
                  </>
                )}
                {selectedOrder.status === "ACCEPTED" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "PREPARING")} className="btn-accept" style={{ width: "100%" }}>
                    <div className="inner-btn"><CheckCircle2 size={16} /></div>
                    Start Preparing
                  </button>
                )}
                {selectedOrder.status === "PREPARING" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>Assign Rider to mark READY:</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <select
                        className="warm-input"
                        value={assigningRiderId}
                        onChange={(e) => setAssigningRiderId(e.target.value)}
                        style={{ flexGrow: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                      >
                        <option value="">-- Choose Rider --</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.vehicleType || "Motorcycle"})</option>
                        ))}
                        {riders.length === 0 && (
                          <>
                            <option value="mock-rider-1">Rider Ahmad (Motorcycle)</option>
                            <option value="mock-rider-2">Rider Zain (Car)</option>
                          </>
                        )}
                      </select>
                      <button onClick={handleAssignRider} className="btn-accept" style={{ padding: "0 20px" }}>Assign</button>
                    </div>
                    <button onClick={() => updateStatus(selectedOrder.id, "READY")} className="btn btn-secondary">
                      Mark Ready without Rider
                    </button>
                  </div>
                )}
                {selectedOrder.status === "READY" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "OUT_FOR_DELIVERY")} className="btn-accept" style={{ width: "100%" }}>
                    <div className="inner-btn"><CheckCircle2 size={16} /></div>
                    Send for Delivery
                  </button>
                )}
                {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                  <button onClick={() => updateStatus(selectedOrder.id, "DELIVERED")} className="btn-accept" style={{ width: "100%", background: "linear-gradient(135deg, #10B981, #059669)" }}>
                    <div className="inner-btn"><CheckCircle2 size={16} /></div>
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {rejectModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="double-bezel animate-scale-in" style={{ width: "100%", maxWidth: "400px" }}>
            <div className="double-bezel-inner" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg-card)", borderRadius: "var(--radius-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--error)" }}>
                <AlertCircle size={24} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Reject Order</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Reason for rejection:</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="warm-input"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", transition: "all var(--transition-fast)" }}
                  placeholder="e.g. Out of stock, outside delivery area..."
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button onClick={() => { setRejectModalOpen(false); setRejectReason(""); }} className="btn btn-secondary" style={{ padding: "10px 16px" }}>Cancel</button>
                <button onClick={() => { updateStatus(selectedOrder.id, "REJECTED"); setRejectModalOpen(false); setRejectReason(""); }} className="btn-reject" style={{ padding: "10px 16px" }}>Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
