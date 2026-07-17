"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Copy, ToggleLeft, ToggleRight, Grid, Tag, Image, Utensils } from "lucide-react";
import { useAdminQuery, useAdminMutation } from "./hooks/useAdminApi";
import { AdminTable, Column } from "./components/AdminTable";
import { AdminModal, ConfirmDialog } from "./components/AdminModal";
import { useToast } from "@/components/AdminToast";

export default function AdminMenu() {
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'discounts' | 'banners'>('items');
  const { addToast } = useToast();

  // Queries
  const { data: categories, refetch: refetchCategories } = useAdminQuery('/owner/categories');
  const { data: menuItems, refetch: refetchItems } = useAdminQuery('/owner/menu-items');
  const { data: discounts, refetch: refetchDiscounts } = useAdminQuery('/owner/discounts');
  const { data: banners, refetch: refetchBanners } = useAdminQuery('/owner/banners');

  const categoriesList = categories?.data || categories || [];
  const menuItemsList = menuItems?.data || menuItems || [];
  const discountsList = discounts?.data || discounts || [];
  const bannersList = banners?.data || banners || [];

  // Mutations
  const { mutate: createItem } = useAdminMutation('/owner/menu-items', 'POST');
  const { mutate: updateItem } = useAdminMutation('', 'PUT');
  const { mutate: deleteItem } = useAdminMutation('', 'DELETE');

  const { mutate: createCat } = useAdminMutation('/owner/categories', 'POST');
  const { mutate: updateCat } = useAdminMutation('', 'PUT');
  const { mutate: deleteCat } = useAdminMutation('', 'DELETE');

  const { mutate: createDisc } = useAdminMutation('/owner/discounts', 'POST');
  const { mutate: updateDisc } = useAdminMutation('', 'PUT');
  const { mutate: deleteDisc } = useAdminMutation('', 'DELETE');

  const { mutate: createBan } = useAdminMutation('/owner/banners', 'POST');
  const { mutate: updateBan } = useAdminMutation('', 'PUT');
  const { mutate: deleteBan } = useAdminMutation('', 'DELETE');

  // Modals state
  const [itemModal, setItemModal] = useState({
    open: false, id: '', categoryId: '', name: '', description: '', price: '',
    imageUrl: '', isAvailable: true, inStock: true, stockQuantity: '',
    isFeatured: false, isSpicy: false, preparationTime: '20'
  });

  const [categoryModal, setCategoryModal] = useState({ open: false, id: '', name: '', description: '', sortOrder: '0' });
  const [discountModal, setDiscountModal] = useState({
    open: false, id: '', title: '', type: 'PERCENT', value: '', scope: 'ITEM',
    promoCode: '', startDate: '', endDate: '', isActive: true
  });
  const [bannerModal, setBannerModal] = useState({ open: false, id: '', title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true, sortOrder: '0' });

  // Delete dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'item' | 'category' | 'discount' | 'banner'; id: string }>({ open: false, type: 'item', id: '' });

  // Handle Item Saving
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemModal,
        price: parseFloat(itemModal.price),
        stockQuantity: itemModal.stockQuantity ? parseInt(itemModal.stockQuantity) : null,
        preparationTime: parseInt(itemModal.preparationTime),
      };
      if (itemModal.id) {
        await updateItem(payload, `/owner/menu-items/${itemModal.id}`);
        addToast({ type: 'success', title: 'Item Updated', message: `${itemModal.name} updated successfully.` });
      } else {
        await createItem(payload);
        addToast({ type: 'success', title: 'Item Created', message: `${itemModal.name} created successfully.` });
      }
      setItemModal(prev => ({ ...prev, open: false }));
      refetchItems();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Save', message: err.message });
    }
  };

  // Handle Item Clone
  const handleCloneItem = async (item: any) => {
    try {
      const payload = {
        categoryId: item.categoryId,
        name: `${item.name} (Copy)`,
        description: item.description,
        price: parseFloat(item.price.toString()),
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        inStock: item.inStock,
        stockQuantity: item.stockQuantity,
        isFeatured: item.isFeatured,
        isSpicy: item.isSpicy,
        preparationTime: item.preparationTime
      };
      await createItem(payload);
      addToast({ type: 'success', title: 'Item Cloned', message: `${item.name} copied successfully.` });
      refetchItems();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Clone', message: err.message });
    }
  };

  // Handle Inline Item Toggle
  const handleToggleItemAvailability = async (item: any) => {
    try {
      await updateItem({ ...item, isAvailable: !item.isAvailable }, `/owner/menu-items/${item.id}`);
      addToast({ type: 'success', title: 'Status Updated', message: `Availability status changed.` });
      refetchItems();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Toggle Failed', message: err.message });
    }
  };

  // Handle Category Saving
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...categoryModal, sortOrder: parseInt(categoryModal.sortOrder) };
      if (categoryModal.id) {
        await updateCat(payload, `/owner/categories/${categoryModal.id}`);
        addToast({ type: 'success', title: 'Category Updated', message: `${categoryModal.name} saved.` });
      } else {
        await createCat(payload);
        addToast({ type: 'success', title: 'Category Created', message: `${categoryModal.name} created.` });
      }
      setCategoryModal(prev => ({ ...prev, open: false }));
      refetchCategories();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  // Handle Discount Saving
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...discountModal,
        value: parseFloat(discountModal.value),
        startDate: new Date(discountModal.startDate),
        endDate: new Date(discountModal.endDate)
      };
      if (discountModal.id) {
        await updateDisc(payload, `/owner/discounts/${discountModal.id}`);
        addToast({ type: 'success', title: 'Discount Updated', message: 'Promo code saved successfully.' });
      } else {
        await createDisc(payload);
        addToast({ type: 'success', title: 'Discount Created', message: 'Promo code created successfully.' });
      }
      setDiscountModal(prev => ({ ...prev, open: false }));
      refetchDiscounts();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Save', message: err.message });
    }
  };

  // Handle Banner Saving
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...bannerModal, sortOrder: parseInt(bannerModal.sortOrder) };
      if (bannerModal.id) {
        await updateBan(payload, `/owner/banners/${bannerModal.id}`);
        addToast({ type: 'success', title: 'Banner Updated', message: 'Homepage banner saved.' });
      } else {
        await createBan(payload);
        addToast({ type: 'success', title: 'Banner Created', message: 'Homepage banner created.' });
      }
      setBannerModal(prev => ({ ...prev, open: false }));
      refetchBanners();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const { type, id } = deleteConfirm;
      if (type === 'item') {
        await deleteItem(null, `/owner/menu-items/${id}`);
        refetchItems();
      } else if (type === 'category') {
        await deleteCat(null, `/owner/categories/${id}`);
        refetchCategories();
      } else if (type === 'discount') {
        await deleteDisc(null, `/owner/discounts/${id}`);
        refetchDiscounts();
      } else if (type === 'banner') {
        await deleteBan(null, `/owner/banners/${id}`);
        refetchBanners();
      }
      addToast({ type: 'success', title: 'Deleted', message: `${type} deleted successfully.` });
      setDeleteConfirm({ open: false, type: 'item', id: '' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Delete', message: err.message });
    }
  };

  const columnsItems: Column[] = [
    {
      key: 'name',
      label: 'Dish Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🍛</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{row.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.category?.name || 'No Category'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (row) => `Rs. ${parseFloat(row.price).toLocaleString()}`
    },
    {
      key: 'stock',
      label: 'Stock Status',
      render: (row) => row.inStock ? `In Stock (${row.stockQuantity ?? '∞'})` : 'Out of Stock'
    },
    {
      key: 'isAvailable',
      label: 'Active Available',
      render: (row) => (
        <button onClick={() => handleToggleItemAvailability(row)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: row.isAvailable ? 'var(--success)' : 'var(--text-muted)' }}>
          {row.isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setItemModal({
              open: true, id: row.id, categoryId: row.categoryId, name: row.name, description: row.description || '',
              price: String(row.price), imageUrl: row.imageUrl || '', isAvailable: row.isAvailable,
              inStock: row.inStock, stockQuantity: row.stockQuantity ? String(row.stockQuantity) : '',
              isFeatured: row.isFeatured, isSpicy: row.isSpicy, preparationTime: String(row.preparationTime)
            })}
            className="btn btn-secondary" style={{ padding: '4px 6px' }}
          >
            <Edit2 size={13} />
          </button>
          <button onClick={() => handleCloneItem(row)} className="btn btn-secondary" style={{ padding: '4px 6px' }} title="Duplicate Item"><Copy size={13} /></button>
          <button onClick={() => setDeleteConfirm({ open: true, type: 'item', id: row.id })} className="btn btn-secondary" style={{ padding: '4px 6px', color: 'var(--error)' }}><Trash2 size={13} /></button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Menu & Catalog</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Create and organize dishes, branches categories, promo codes and sliders.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'items' && (
            <button
              onClick={() => setItemModal({
                open: true, id: '', categoryId: categoriesList[0]?.id || '', name: '', description: '', price: '',
                imageUrl: '', isAvailable: true, inStock: true, stockQuantity: '', isFeatured: false, isSpicy: false, preparationTime: '20'
              })}
              className="btn" style={{ background: 'var(--saffron)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Create Dish
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={() => setCategoryModal({ open: true, id: '', name: '', description: '', sortOrder: '0' })}
              className="btn" style={{ background: 'var(--saffron)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Create Category
            </button>
          )}
          {activeTab === 'discounts' && (
            <button
              onClick={() => setDiscountModal({
                open: true, id: '', title: '', type: 'PERCENT', value: '', scope: 'ITEM',
                promoCode: '', startDate: '', endDate: '', isActive: true
              })}
              className="btn" style={{ background: 'var(--saffron)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Create Discount
            </button>
          )}
          {activeTab === 'banners' && (
            <button
              onClick={() => setBannerModal({ open: true, id: '', title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true, sortOrder: '0' })}
              className="btn" style={{ background: 'var(--saffron)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Create Banner
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '16px' }}>
        <button onClick={() => setActiveTab('items')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'items' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'items' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Utensils size={16} /> Dishes List
        </button>
        <button onClick={() => setActiveTab('categories')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'categories' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'categories' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Grid size={16} /> Categories
        </button>
        <button onClick={() => setActiveTab('discounts')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'discounts' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'discounts' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Tag size={16} /> Discounts & Promos
        </button>
        <button onClick={() => setActiveTab('banners')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'banners' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'banners' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Image size={16} /> Banners Slider
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card" style={{ padding: '24px' }}>
        {activeTab === 'items' && (
          <AdminTable columns={columnsItems} data={menuItemsList} />
        )}

        {activeTab === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {categoriesList.map((cat: any) => (
              <div key={cat.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setCategoryModal({ open: true, id: cat.id, name: cat.name, description: cat.description || '', sortOrder: String(cat.sortOrder) })}
                      className="btn btn-secondary" style={{ padding: '4px 6px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ open: true, type: 'category', id: cat.id })} className="btn btn-secondary" style={{ padding: '4px 6px', color: 'var(--error)' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cat.description || 'No description provided.'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--saffron)' }}>Sort Order: {cat.sortOrder}</span>
                  <span style={{ color: cat.isActive ? 'var(--success)' : 'var(--text-muted)' }}>{cat.isActive ? 'Active' : 'Hidden'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'discounts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {discountsList.map((disc: any) => (
              <div key={disc.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--maroon)' }}>{disc.promoCode || 'AUTO DISCOUNT'}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setDiscountModal({
                        open: true, id: disc.id, title: disc.title, type: disc.type, value: String(disc.value),
                        scope: disc.scope, promoCode: disc.promoCode || '', startDate: disc.startDate.substring(0, 10),
                        endDate: disc.endDate.substring(0, 10), isActive: disc.isActive
                      })}
                      className="btn btn-secondary" style={{ padding: '4px 6px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ open: true, type: 'discount', id: disc.id })} className="btn btn-secondary" style={{ padding: '4px 6px', color: 'var(--error)' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{disc.title}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Value: {disc.type === 'PERCENT' ? `${disc.value}%` : `Rs. ${disc.value}`} ({disc.scope})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  Valid: {new Date(disc.startDate).toLocaleDateString()} — {new Date(disc.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'banners' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {bannersList.map((ban: any) => (
              <div key={ban.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ban.imageUrl && (
                  <img src={ban.imageUrl} alt={ban.title} style={{ width: '100%', height: '120px', borderRadius: '6px', objectFit: 'cover' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 700 }}>{ban.title}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setBannerModal({
                        open: true, id: ban.id, title: ban.title, subtitle: ban.subtitle || '',
                        imageUrl: ban.imageUrl, linkUrl: ban.linkUrl || '', isActive: ban.isActive, sortOrder: String(ban.sortOrder)
                      })}
                      className="btn btn-secondary" style={{ padding: '4px 6px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ open: true, type: 'banner', id: ban.id })} className="btn btn-secondary" style={{ padding: '4px 6px', color: 'var(--error)' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ban.subtitle}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Modal Form */}
      <AdminModal
        open={itemModal.open}
        onClose={() => setItemModal(prev => ({ ...prev, open: false }))}
        title={itemModal.id ? "Edit Dish details" : "Create New Menu Dish"}
        footer={
          <>
            <button onClick={() => setItemModal(prev => ({ ...prev, open: false }))} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="item-form" className="btn" style={{ background: 'var(--saffron)', color: '#fff' }}>Save Product</button>
          </>
        }
      >
        <form id="item-form" onSubmit={handleSaveItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dish Name *</label>
            <input
              type="text" required
              value={itemModal.name}
              onChange={(e) => setItemModal(prev => ({ ...prev, name: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category *</label>
            <select
              required
              value={itemModal.categoryId}
              onChange={(e) => setItemModal(prev => ({ ...prev, categoryId: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {categoriesList.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Price (PKR) *</label>
            <input
              type="number" required step="0.01"
              value={itemModal.price}
              onChange={(e) => setItemModal(prev => ({ ...prev, price: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Image URL</label>
            <input
              type="text"
              value={itemModal.imageUrl}
              onChange={(e) => setItemModal(prev => ({ ...prev, imageUrl: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
            <textarea
              rows={3}
              value={itemModal.description}
              onChange={(e) => setItemModal(prev => ({ ...prev, description: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Stock Quantity (Optional)</label>
            <input
              type="number"
              value={itemModal.stockQuantity}
              onChange={(e) => setItemModal(prev => ({ ...prev, stockQuantity: e.target.value }))}
              placeholder="Leave empty for infinite"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Preparation Time (mins)</label>
            <input
              type="number" required
              value={itemModal.preparationTime}
              onChange={(e) => setItemModal(prev => ({ ...prev, preparationTime: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '16px', gridColumn: 'span 2', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={itemModal.inStock} onChange={(e) => setItemModal(prev => ({ ...prev, inStock: e.target.checked }))} style={{ accentColor: 'var(--saffron)' }} /> In Stock
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={itemModal.isFeatured} onChange={(e) => setItemModal(prev => ({ ...prev, isFeatured: e.target.checked }))} style={{ accentColor: 'var(--saffron)' }} /> Featured Dish
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={itemModal.isSpicy} onChange={(e) => setItemModal(prev => ({ ...prev, isSpicy: e.target.checked }))} style={{ accentColor: 'var(--saffron)' }} /> Spicy 🌶️
            </label>
          </div>
        </form>
      </AdminModal>

      {/* Category Modal Form */}
      <AdminModal
        open={categoryModal.open}
        onClose={() => setCategoryModal(prev => ({ ...prev, open: false }))}
        title={categoryModal.id ? "Edit Category" : "Create Category"}
        footer={
          <>
            <button onClick={() => setCategoryModal(prev => ({ ...prev, open: false }))} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="cat-form" className="btn" style={{ background: 'var(--saffron)', color: '#fff' }}>Save Category</button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category Name *</label>
            <input
              type="text" required
              value={categoryModal.name}
              onChange={(e) => setCategoryModal(prev => ({ ...prev, name: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
            <textarea
              rows={3}
              value={categoryModal.description}
              onChange={(e) => setCategoryModal(prev => ({ ...prev, description: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sort Order</label>
            <input
              type="number" required
              value={categoryModal.sortOrder}
              onChange={(e) => setCategoryModal(prev => ({ ...prev, sortOrder: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </form>
      </AdminModal>

      {/* Discount Modal Form */}
      <AdminModal
        open={discountModal.open}
        onClose={() => setDiscountModal(prev => ({ ...prev, open: false }))}
        title={discountModal.id ? "Edit Promo Code" : "Create Promo Code"}
        footer={
          <>
            <button onClick={() => setDiscountModal(prev => ({ ...prev, open: false }))} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="disc-form" className="btn" style={{ background: 'var(--saffron)', color: '#fff' }}>Save Discount</button>
          </>
        }
      >
        <form id="disc-form" onSubmit={handleSaveDiscount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Promo Code *</label>
            <input
              type="text" required
              value={discountModal.promoCode}
              onChange={(e) => setDiscountModal(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
              placeholder="e.g. NASEEB20"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discount Title / Label *</label>
            <input
              type="text" required
              value={discountModal.title}
              onChange={(e) => setDiscountModal(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. 20% discount on entire first checkout order"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discount Type</label>
            <select
              value={discountModal.type}
              onChange={(e) => setDiscountModal(prev => ({ ...prev, type: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat Amount (PKR)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discount Value *</label>
            <input
              type="number" required step="0.01"
              value={discountModal.value}
              onChange={(e) => setDiscountModal(prev => ({ ...prev, value: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Start Date *</label>
            <input
              type="date" required
              value={discountModal.startDate}
              onChange={(e) => setDiscountModal(prev => ({ ...prev, startDate: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Expiry Date *</label>
            <input
              type="date" required
              value={discountModal.endDate}
              onChange={(e) => setDiscountModal(prev => ({ ...prev, endDate: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </form>
      </AdminModal>

      {/* Banner Modal Form */}
      <AdminModal
        open={bannerModal.open}
        onClose={() => setBannerModal(prev => ({ ...prev, open: false }))}
        title={bannerModal.id ? "Edit Banner Slider" : "Create Banner Slider"}
        footer={
          <>
            <button onClick={() => setBannerModal(prev => ({ ...prev, open: false }))} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="banner-form" className="btn" style={{ background: 'var(--saffron)', color: '#fff' }}>Save Banner</button>
          </>
        }
      >
        <form id="banner-form" onSubmit={handleSaveBanner} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Banner Title *</label>
            <input
              type="text" required
              value={bannerModal.title}
              onChange={(e) => setBannerModal(prev => ({ ...prev, title: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subtitle</label>
            <input
              type="text"
              value={bannerModal.subtitle}
              onChange={(e) => setBannerModal(prev => ({ ...prev, subtitle: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Image URL *</label>
            <input
              type="text" required
              value={bannerModal.imageUrl}
              onChange={(e) => setBannerModal(prev => ({ ...prev, imageUrl: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Link URL redirect (optional)</label>
            <input
              type="text"
              value={bannerModal.linkUrl}
              onChange={(e) => setBannerModal(prev => ({ ...prev, linkUrl: e.target.value }))}
              placeholder="e.g. /menu"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sort Order</label>
            <input
              type="number" required
              value={bannerModal.sortOrder}
              onChange={(e) => setBannerModal(prev => ({ ...prev, sortOrder: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: 'item', id: '' })}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${deleteConfirm.type}? This action cannot be undone.`}
        confirmLabel="Confirm Delete"
        danger
      />
    </div>
  );
}
