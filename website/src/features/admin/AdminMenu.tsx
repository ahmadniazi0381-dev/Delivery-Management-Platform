"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, Image } from "lucide-react";

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Biryani Dishes', description: 'Fragrant spicy basmati biryani specials', isActive: true, sortOrder: 1 },
  { id: 'cat-2', name: 'Pulao Delights', description: 'Rich traditional pulao layered with spices', isActive: true, sortOrder: 2 },
  { id: 'cat-3', name: 'Drinks & Addons', description: 'Cold beverages, extra raita, and salad salads', isActive: true, sortOrder: 3 }
];

const MOCK_MENU = [
  { id: 'item-1', categoryId: 'cat-1', name: 'Naseeb Special Biryani', description: 'Famous Karachi spicy biryani with chicken and masala potato.', price: 350, isAvailable: true, inStock: true, isFeatured: true, isSpicy: true, preparationTime: 25 },
  { id: 'item-2', categoryId: 'cat-1', name: 'Beef Masala Biryani', description: 'Traditional slow-cooked beef biryani with thick spicy gravy.', price: 420, isAvailable: true, inStock: true, isFeatured: false, isSpicy: true, preparationTime: 30 },
  { id: 'item-3', categoryId: 'cat-2', name: 'Sada Pulao (Double)', description: 'Fragrant golden pulao served double size.', price: 350, isAvailable: true, inStock: true, isFeatured: false, isSpicy: false, preparationTime: 20 }
];

export default function AdminMenu() {
  const [categories, setCategories] = useState<any[]>(MOCK_CATEGORIES);
  const [menuItems, setMenuItems] = useState<any[]>(MOCK_MENU);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [isOffline, setIsOffline] = useState(false);

  // Forms
  const [categoryModal, setCategoryModal] = useState({ open: false, id: '', name: '', description: '', sortOrder: 0 });
  const [menuModal, setMenuModal] = useState({
    open: false,
    id: '',
    categoryId: 'cat-1',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    inStock: true,
    isFeatured: false,
    isSpicy: false,
    preparationTime: 20
  });

  const fetchCategories = async () => {
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") {
      setIsOffline(true);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
          setIsOffline(false);
        }
      }
    } catch {
      setIsOffline(true);
    }
  };

  const fetchMenuItems = async () => {
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") {
      setIsOffline(true);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/items`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMenuItems(data.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      if (categoryModal.id) {
        setCategories(prev => prev.map(c => c.id === categoryModal.id ? { ...c, name: categoryModal.name, description: categoryModal.description } : c));
      } else {
        setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: categoryModal.name, description: categoryModal.description, isActive: true, sortOrder: categories.length + 1 }]);
      }
      setCategoryModal({ open: false, id: '', name: '', description: '', sortOrder: 0 });
      return;
    }

    const token = localStorage.getItem("naseeb_token");
    const url = categoryModal.id ? `${process.env.NEXT_PUBLIC_API_URL}/owner/categories/${categoryModal.id}` : `${process.env.NEXT_PUBLIC_API_URL}/owner/categories`;
    const method = categoryModal.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: categoryModal.name, description: categoryModal.description, sortOrder: categoryModal.sortOrder })
      });
      if (res.ok) {
        fetchCategories();
        setCategoryModal({ open: false, id: '', name: '', description: '', sortOrder: 0 });
      }
    } catch {}
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    if (isOffline) {
      setCategories(prev => prev.filter(c => c.id !== id));
      return;
    }

    const token = localStorage.getItem("naseeb_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCategories();
    } catch {}
  };

  const saveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(menuModal.price) || 0;
    if (isOffline) {
      if (menuModal.id) {
        setMenuItems(prev => prev.map(m => m.id === menuModal.id ? {
          ...m,
          categoryId: menuModal.categoryId,
          name: menuModal.name,
          description: menuModal.description,
          price: priceNum,
          imageUrl: menuModal.imageUrl,
          isAvailable: menuModal.isAvailable,
          inStock: menuModal.inStock,
          isFeatured: menuModal.isFeatured,
          isSpicy: menuModal.isSpicy,
          preparationTime: menuModal.preparationTime
        } : m));
      } else {
        setMenuItems(prev => [...prev, {
          id: `item-${Date.now()}`,
          categoryId: menuModal.categoryId,
          name: menuModal.name,
          description: menuModal.description,
          price: priceNum,
          imageUrl: menuModal.imageUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300',
          isAvailable: true,
          inStock: true,
          isFeatured: menuModal.isFeatured,
          isSpicy: menuModal.isSpicy,
          preparationTime: menuModal.preparationTime
        }]);
      }
      setMenuModal({ open: false, id: '', categoryId: 'cat-1', name: '', description: '', price: '', imageUrl: '', isAvailable: true, inStock: true, isFeatured: false, isSpicy: false, preparationTime: 20 });
      return;
    }

    const token = localStorage.getItem("naseeb_token");
    const url = menuModal.id ? `${process.env.NEXT_PUBLIC_API_URL}/owner/menu-items/${menuModal.id}` : `${process.env.NEXT_PUBLIC_API_URL}/owner/menu-items`;
    const method = menuModal.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categoryId: menuModal.categoryId,
          name: menuModal.name,
          description: menuModal.description,
          price: priceNum,
          imageUrl: menuModal.imageUrl || undefined,
          isAvailable: menuModal.isAvailable,
          inStock: menuModal.inStock,
          isFeatured: menuModal.isFeatured,
          isSpicy: menuModal.isSpicy,
          preparationTime: menuModal.preparationTime
        })
      });
      if (res.ok) {
        fetchMenuItems();
        setMenuModal({ open: false, id: '', categoryId: 'cat-1', name: '', description: '', price: '', imageUrl: '', isAvailable: true, inStock: true, isFeatured: false, isSpicy: false, preparationTime: 20 });
      }
    } catch {}
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    if (isOffline) {
      setMenuItems(prev => prev.filter(m => m.id !== id));
      return;
    }

    const token = localStorage.getItem("naseeb_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/menu-items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchMenuItems();
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Menu Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Add dishes, edit prices, and reorder categories.</p>
        </div>

        {/* View Switcher */}
        <div style={{ display: "flex", background: "var(--border)", padding: "4px", borderRadius: "8px" }}>
          <button
            onClick={() => setActiveTab('items')}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === 'items' ? "var(--bg-card)" : "transparent",
              color: activeTab === 'items' ? "var(--saffron)" : "var(--text-secondary)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Dishes
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === 'categories' ? "var(--bg-card)" : "transparent",
              color: activeTab === 'categories' ? "var(--saffron)" : "var(--text-secondary)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Categories
          </button>
        </div>
      </div>

      {/* DISHES LIST */}
      {activeTab === 'items' && (
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>All Food Items</h3>
            <button
              onClick={() => setMenuModal({
                open: true, id: '', categoryId: categories[0]?.id || 'cat-1',
                name: '', description: '', price: '', imageUrl: '', isAvailable: true,
                inStock: true, isFeatured: false, isSpicy: false, preparationTime: 20
              })}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Dish
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  <th style={{ padding: "12px" }}>Item Info</th>
                  <th style={{ padding: "12px" }}>Category</th>
                  <th style={{ padding: "12px" }}>Price</th>
                  <th style={{ padding: "12px" }}>Time</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              🍛
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {item.name} {item.isSpicy && "🌶️"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.description || "No description"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{cat ? cat.name : "Uncategorized"}</td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Rs. {item.price}</td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>⏰ {item.preparationTime || 20}m</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "12px", background: item.inStock ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: item.inStock ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            onClick={() => setMenuModal({
                              open: true, id: item.id, categoryId: item.categoryId,
                              name: item.name, description: item.description || '', price: item.price.toString(),
                              imageUrl: item.imageUrl || '', isAvailable: item.isAvailable,
                              inStock: item.inStock, isFeatured: item.isFeatured || false,
                              isSpicy: item.isSpicy || false, preparationTime: item.preparationTime || 20
                            })}
                            className="btn btn-secondary"
                            style={{ padding: "6px" }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            className="btn btn-danger"
                            style={{ padding: "6px", color: "var(--error)", background: "transparent" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES LIST */}
      {activeTab === 'categories' && (
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Food Categories</h3>
            <button
              onClick={() => setCategoryModal({ open: true, id: '', name: '', description: '', sortOrder: categories.length + 1 })}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  <th style={{ padding: "12px" }}>Sort Order</th>
                  <th style={{ padding: "12px" }}>Category Name</th>
                  <th style={{ padding: "12px" }}>Description</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr key={cat.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}>
                    <td style={{ padding: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{cat.sortOrder || idx + 1}</td>
                    <td style={{ padding: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{cat.description || "No description"}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          onClick={() => setCategoryModal({ open: true, id: cat.id, name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder || 0 })}
                          className="btn btn-secondary"
                          style={{ padding: "6px" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="btn btn-danger"
                          style={{ padding: "6px", color: "var(--error)", background: "transparent" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISH MODAL */}
      {menuModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card fade-in" style={{ width: "100%", maxWidth: "500px", padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--text-primary)" }}>{menuModal.id ? "Edit Dish" : "Add Dish"}</h3>
            <form onSubmit={saveMenuItem} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Category</label>
                <select className="input-field" value={menuModal.categoryId} onChange={(e) => setMenuModal(prev => ({ ...prev, categoryId: e.target.value }))}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Dish Name</label>
                <input type="text" className="input-field" value={menuModal.name} onChange={(e) => setMenuModal(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Description</label>
                <input type="text" className="input-field" value={menuModal.description} onChange={(e) => setMenuModal(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Price (Rs.)</label>
                  <input type="number" className="input-field" value={menuModal.price} onChange={(e) => setMenuModal(prev => ({ ...prev, price: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Prep Time (mins)</label>
                  <input type="number" className="input-field" value={menuModal.preparationTime} onChange={(e) => setMenuModal(prev => ({ ...prev, preparationTime: parseInt(e.target.value, 10) }))} required />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Image URL</label>
                <input type="text" className="input-field" value={menuModal.imageUrl} onChange={(e) => setMenuModal(prev => ({ ...prev, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ display: "flex", gap: "15px", padding: "5px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={menuModal.isFeatured} onChange={(e) => setMenuModal(prev => ({ ...prev, isFeatured: e.target.checked }))} /> Featured
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={menuModal.isSpicy} onChange={(e) => setMenuModal(prev => ({ ...prev, isSpicy: e.target.checked }))} /> Spicy 🌶️
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={menuModal.inStock} onChange={(e) => setMenuModal(prev => ({ ...prev, inStock: e.target.checked }))} /> In Stock
                </label>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, justifyContent: "center" }}>Save Dish</button>
                <button type="button" className="btn btn-secondary" onClick={() => setMenuModal({ open: false, id: '', categoryId: 'cat-1', name: '', description: '', price: '', imageUrl: '', isAvailable: true, inStock: true, isFeatured: false, isSpicy: false, preparationTime: 20 })}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {categoryModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card fade-in" style={{ width: "100%", maxWidth: "450px", padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--text-primary)" }}>{categoryModal.id ? "Edit Category" : "Add Category"}</h3>
            <form onSubmit={saveCategory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Category Name</label>
                <input type="text" className="input-field" value={categoryModal.name} onChange={(e) => setCategoryModal(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Description</label>
                <input type="text" className="input-field" value={categoryModal.description} onChange={(e) => setCategoryModal(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>Sort Order</label>
                <input type="number" className="input-field" value={categoryModal.sortOrder} onChange={(e) => setCategoryModal(prev => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, justifyContent: "center" }}>Save Category</button>
                <button type="button" className="btn btn-secondary" onClick={() => setCategoryModal({ open: false, id: '', name: '', description: '', sortOrder: 0 })}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
