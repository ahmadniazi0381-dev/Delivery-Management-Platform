"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface FoodImageUploadProps {
  imageUrl: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function FoodImageUpload({ imageUrl, onChange, onUploadingChange }: FoodImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const handleUploadFile = async (file: File) => {
    setErrorMsg(null);

    // Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Unsupported file format. Only JPEG, PNG, and WebP photos are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    setIsUploading(true);
    if (onUploadingChange) onUploadingChange(true);
    setUploadProgress("Optimizing & uploading to Supabase Storage...");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "menu-items");

      const token = typeof window !== "undefined" ? localStorage.getItem("naseeb_token") : null;

      const res = await fetch(`${API_URL}/api/admin/upload-image`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to upload image.");
      }

      onChange(json.imageUrl);
      setUploadProgress("Uploaded successfully!");
    } catch (err: any) {
      console.error("Food image upload error:", err);
      setErrorMsg(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (onUploadingChange) onUploadingChange(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
        <ImageIcon size={16} style={{ color: "var(--saffron)" }} />
        Food Dish Photo <span style={{ color: "#EF4444" }}>* (Compulsory)</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* Upload Box or Live Preview */}
      {imageUrl ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          {/* Live Preview */}
          <div
            style={{
              position: "relative",
              width: "90px",
              height: "90px",
              borderRadius: "10px",
              overflow: "hidden",
              border: "2px solid var(--saffron)",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src={imageUrl}
              alt="Food Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success)", fontSize: "0.85rem", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              Photo Attached
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
              {imageUrl}
            </p>

            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                <RefreshCw size={14} /> Change Image
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={isUploading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#FEE2E2",
                  border: "1px solid #FCA5A5",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#DC2626",
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            border: isDragging ? "2px dashed var(--saffron)" : "2px dashed var(--border)",
            background: isDragging ? "rgba(245, 158, 11, 0.08)" : "var(--bg-secondary)",
            borderRadius: "12px",
            padding: "28px 16px",
            textAlign: "center",
            cursor: isUploading ? "wait" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--saffron)" }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {uploadProgress}
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--saffron)",
                }}
              >
                <UploadCloud size={24} />
              </div>

              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Drag & Drop Food Image Here
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  or click to browse from device (JPEG, PNG, WEBP — Max 5MB)
                </p>
              </div>

              <button
                type="button"
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "var(--saffron)",
                  color: "#1C0A00",
                  fontWeight: 700,
                  fontSize: "0.825rem",
                  border: "none",
                  marginTop: "4px",
                  cursor: "pointer",
                }}
              >
                Browse Dish Photo
              </button>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#DC2626", background: "#FEF2F2", border: "1px solid #FCA5A5", padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Required Validation Warning */}
      {!imageUrl && !isUploading && (
        <div style={{ fontSize: "0.78rem", color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
          ⚠️ Food image is required. Product cannot be saved without an image.
        </div>
      )}
    </div>
  );
}
