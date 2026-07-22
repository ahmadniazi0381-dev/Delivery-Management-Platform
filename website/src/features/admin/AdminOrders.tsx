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

// No mock data — all orders come from the real API (/owner/orders)

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [riders, setRiders] = useState<any[]>([]);
  const [assigningRiderId, setAssigningRiderId] = useState<string>("");
  const [liveFlash, setLiveFlash] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") {
      setIsOffline(true);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, riderId })
      });
      if (!res.ok) {
        addToast({ type: "error", title: "Update Failed", message: "Could not update order status." });
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

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
      <style>{`
        @keyframes live-flash { 0%{opacity:1}50%{opacity:0.3}100%{opacity:1} }
        @keyframes slide-in { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        .live-flash { animation: live-flash 0.4s ease; }
        .animate-scale-in { animation: slide-in 0.25s ease forwards; }
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

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
        {STATUS_FLOW.map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          const isPending = status === "PENDING" && count > 0;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: isPending ? "2px solid #ef4444" : "none",
                background: activeTab === status
                  ? isPending ? "#ef4444" : "var(--saffron)"
                  : "var(--border)",
                color: activeTab === status ? "#fff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                gap: "6px",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}
            >
              {status.replace(/_/g, ' ')}
              <span style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.2)", color: "#fff", padding: "1px 6px", borderRadius: "10px" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "min(45vw, 520px) 1fr" : "1fr", gap: "24px" }} className="orders-split-grid">
        {/* Orders List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="card animate-scale-in"
              style={{
                padding: "16px",
                border: selectedOrder?.id === order.id
                  ? "2px solid var(--saffron)"
                  : order.status === "PENDING"
                  ? "1px solid rgba(239,68,68,0.4)"
                  : "1px solid var(--border)",
                cursor: "pointer",
                position: "relative",
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
              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {order.orderItems?.length || 0} items · {order.paymentMethod}
                </span>
                <span style={{ fontWeight: 800, color: "var(--saffron)" }}>Rs. {order.total}</span>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic", padding: "40px 0" }}>
              No orders in {activeTab.replace(/_/g, ' ')} queue.
            </p>
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div className="card fade-in" style={{ padding: "24px", alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
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
                  <h2>Karachi Naseeb Baryani & Pulao</h2>
                  <p>UCP Branch, Lahore</p>
                  <p>Phone: +92 300 1234567</p>
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
              <div><strong>Status:</strong> <span style={{ fontWeight: 700, color: selectedOrder.status === "PENDING" ? "#ef4444" : "var(--saffron)" }}>{selectedOrder.status}</span></div>
              <div><strong>Payment:</strong> {selectedOrder.paymentMethod}</div>
              <div><strong>Customer:</strong> {selectedOrder.customer?.name}</div>
              <div><strong>Phone:</strong> {selectedOrder.customer?.phone}</div>
              <div><strong>Address:</strong> {selectedOrder.address?.addressLine}</div>
            </div>

            {/* Items table */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px" }}>Item Name</th>
                    <th style={{ padding: "10px", width: "80px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "10px", width: "100px", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.orderItems?.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem", borderTop: "1px dashed var(--border)", paddingTop: "8px", marginTop: "4px" }}>
                <span>Grand Total</span><span style={{ color: "var(--saffron)" }}>Rs. {selectedOrder.total}</span>
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
                style={{
                  padding: "10px", borderRadius: "8px", border: "1px solid var(--border)",
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  fontFamily: "inherit", fontSize: "0.85rem", resize: "vertical"
                }}
              />
              {notesSaving && <span style={{ fontSize: "0.75rem", color: "var(--saffron)" }}>Saving notes...</span>}
            </div>

            {/* Workflow Buttons */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {selectedOrder.status === "PENDING" && (
                <>
                  <button onClick={() => updateStatus(selectedOrder.id, "ACCEPTED")} className="btn btn-primary" style={{ flexGrow: 1 }}>
                    ✓ Accept Order
                  </button>
                  <button onClick={() => updateStatus(selectedOrder.id, "REJECTED")} className="btn btn-danger" style={{ flexGrow: 1 }}>
                    ✕ Reject
                  </button>
                </>
              )}
              {selectedOrder.status === "ACCEPTED" && (
                <button onClick={() => updateStatus(selectedOrder.id, "PREPARING")} className="btn btn-primary" style={{ width: "100%" }}>
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === "PREPARING" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>Assign Rider to mark READY:</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      className="input-field"
                      value={assigningRiderId}
                      onChange={(e) => setAssigningRiderId(e.target.value)}
                      style={{ flexGrow: 1 }}
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
                    <button onClick={handleAssignRider} className="btn btn-primary">Assign</button>
                  </div>
                  <button onClick={() => updateStatus(selectedOrder.id, "READY")} className="btn btn-secondary">
                    Mark Ready without Rider
                  </button>
                </div>
              )}
              {selectedOrder.status === "READY" && (
                <button onClick={() => updateStatus(selectedOrder.id, "OUT_FOR_DELIVERY")} className="btn btn-primary" style={{ width: "100%" }}>
                  Send for Delivery
                </button>
              )}
              {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                <button onClick={() => updateStatus(selectedOrder.id, "DELIVERED")} className="btn btn-success" style={{ width: "100%", background: "var(--success)" }}>
                  ✓ Mark Delivered
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
