"use client";

import React, { useEffect, useState } from "react";
import {
  Shirt,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Tag,
  IndianRupee,
  Package,
  Pencil,
  Palette,
  Ruler,
  Filter,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowUpDown,
  Copy,
  Eye,
} from "lucide-react";

export interface ProductVariant {
  id?: string;
  productId?: string;
  sku: string;
  barcode?: string | null;
  size: string;
  color: string;
  price: string | number;
  costPrice: string | number;
  stock: number | string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  price: string | number;
  costPrice: string | number;
  size: string | null;
  color: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  variants?: ProductVariant[];
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "28", "30", "32", "34", "36"];

const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#0f172a" },
  { name: "White", hex: "#f8fafc" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Grey", hex: "#64748b" },
  { name: "Red", hex: "#dc2626" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Olive", hex: "#4d7c0f" },
  { name: "Beige", hex: "#f5f5dc" },
  { name: "Brown", hex: "#78350f" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Maroon", hex: "#881337" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("");

  // Expandable row state to view size & color combo details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // View Details Modal State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form State - start clean without static dummy data
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "Men",
    price: "",
    costPrice: "",
    stock: "0",
    isActive: true,
  });

  // Multi-select Sizes & Colors (empty by default)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("");

  // Variant Combinations Matrix State (empty by default)
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Bulk Apply Price by Color in modal
  const [bulkColorTarget, setBulkColorTarget] = useState<string>("");
  const [bulkPriceValue, setBulkPriceValue] = useState<string>("");

  // Bulk Apply Price by Size in modal
  const [bulkSizeTarget, setBulkSizeTarget] = useState<string>("");
  const [bulkSizePriceValue, setBulkSizePriceValue] = useState<string>("");

  // Create Single Combo tool in Section 3
  const [comboMakerColor, setComboMakerColor] = useState<string>("");
  const [comboMakerSize, setComboMakerSize] = useState<string>("");
  const [comboMakerPrice, setComboMakerPrice] = useState<string>("");
  const [comboMakerStock, setComboMakerStock] = useState<string>("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSizeFilter) params.set("size", selectedSizeFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load products");
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err: any) {
      console.error("Products load error:", err);
      setError(err.message || "Failed to load products");
      // Fallback to empty list so admin can see empty state
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedSizeFilter]);

  // Helper to generate SKU suffix
  const buildVariantSku = (baseSku: string, color: string, size: string) => {
    const cleanBase = (baseSku || "CLS").trim().toUpperCase();
    const cleanColor = color.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
    const cleanSize = size.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return `${cleanBase}-${cleanColor}-${cleanSize}`;
  };


  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      category: "Men",
      price: "",
      costPrice: "",
      stock: "0",
      isActive: true,
    });
    setSelectedSizes([]);
    setSelectedColors([]);
    setCustomSize("");
    setCustomColor("");
    setBulkColorTarget("");
    setBulkPriceValue("");
    setBulkSizeTarget("");
    setBulkSizePriceValue("");
    setComboMakerColor("");
    setComboMakerSize("");
    setComboMakerPrice("");
    setComboMakerStock("");
    setVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category: product.category,
      price: String(product.price),
      costPrice: String(product.costPrice),
      stock: String(product.stock),
      isActive: product.isActive,
    });

    const parsedSizes = product.size
      ? product.size.split(",").map((s) => s.trim()).filter(Boolean)
      : ["M"];
    const parsedColors = product.color
      ? product.color.split(",").map((c) => c.trim()).filter(Boolean)
      : ["Black"];

    setSelectedSizes(parsedSizes);
    setSelectedColors(parsedColors);
    setCustomSize("");
    setCustomColor("");
    setBulkColorTarget(parsedColors[0] || "");
    setBulkPriceValue("");
    setBulkSizeTarget(parsedSizes[0] || "");
    setBulkSizePriceValue("");
    setComboMakerColor(parsedColors[0] || "");
    setComboMakerSize(parsedSizes[0] || "");
    setComboMakerPrice("");
    setComboMakerStock("");

    if (product.variants && product.variants.length > 0) {
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode || "",
          size: v.size,
          color: v.color,
          price: String(v.price),
          costPrice: String(v.costPrice || "0"),
          stock: String(v.stock),
          isActive: v.isActive,
        }))
      );
    } else {
      setVariants([]);
    }

    setIsModalOpen(true);
  };

  const openViewModal = (product: Product) => {
    setViewingProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditFromView = () => {
    if (!viewingProduct) return;
    const prod = viewingProduct;
    setIsViewModalOpen(false);
    setViewingProduct(null);
    openEditModal(prod);
  };

  const generateSku = () => {
    const catPrefix = (formData.category || "GEN").slice(0, 3).toUpperCase();
    let namePart = "CLS";

    if (formData.name.trim()) {
      const cleanWords = formData.name
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/);
      if (cleanWords.length >= 2) {
        namePart = (cleanWords[0].slice(0, 2) + cleanWords[1].slice(0, 2)).toUpperCase();
      } else if (cleanWords.length === 1 && cleanWords[0].length >= 3) {
        namePart = cleanWords[0].slice(0, 3).toUpperCase();
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const autoSku = `${catPrefix}-${namePart}-${randomSuffix}`;
    setFormData((prev) => ({ ...prev, sku: autoSku }));

    // Also update variant SKUs if needed
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sku: buildVariantSku(autoSku, v.color, v.size),
      }))
    );
  };

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(next);
  };

  const addCustomSize = () => {
    if (!customSize.trim()) return;
    const clean = customSize.trim().toUpperCase();
    if (!selectedSizes.includes(clean)) {
      const next = [...selectedSizes, clean];
      setSelectedSizes(next);
    }
    setCustomSize("");
  };

  const toggleColor = (color: string) => {
    const next = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(next);
    if (!bulkColorTarget && next.length > 0) setBulkColorTarget(next[0]);
  };

  const addCustomColor = () => {
    if (!customColor.trim()) return;
    const clean = customColor.trim();
    if (!selectedColors.includes(clean)) {
      const next = [...selectedColors, clean];
      setSelectedColors(next);
      if (!bulkColorTarget) setBulkColorTarget(clean);
    }
    setCustomColor("");
  };

  // Modify individual variant item
  const updateVariantItem = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove a specific variant row
  const removeVariantItem = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Derived options for dropdowns: strictly only the selected sizes & colors
  const availableSizeOptions = selectedSizes;
  const availableColorOptions = selectedColors;
  const matrixColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
  const matrixSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));

  // Add a new manual custom variant combo
  const addManualVariant = () => {
    const defaultColor = selectedColors[0];
    const defaultSize = selectedSizes[0];
    if (!defaultColor || !defaultSize) {
      alert("Please select at least one Size in Step 1 and one Color in Step 2 first.");
      return;
    }
    setVariants((prev) => [
      ...prev,
      {
        sku: buildVariantSku(formData.sku, defaultColor, defaultSize) + "-" + (prev.length + 1),
        barcode: "",
        size: defaultSize,
        color: defaultColor,
        price: formData.price || "0.00",
        costPrice: formData.costPrice || "0.00",
        stock: 0,
        isActive: true,
      },
    ]);
  };

  // Add single custom combo directly using selected Color & Size dropdowns in Section 3
  const handleAddDirectCombo = () => {
    if (!comboMakerColor || !comboMakerSize) {
      alert("Please select both a Color and a Size to add a combo.");
      return;
    }

    const alreadyExists = variants.some(
      (v) =>
        v.color.toLowerCase() === comboMakerColor.toLowerCase() &&
        v.size.toLowerCase() === comboMakerSize.toLowerCase()
    );

    if (alreadyExists) {
      alert(`The combo ${comboMakerColor} / ${comboMakerSize} is already in the matrix.`);
      return;
    }

    const price = comboMakerPrice || formData.price || "0.00";
    const cost = formData.costPrice || "0.00";
    const stock = parseInt(comboMakerStock, 10) || 0;

    const newVariant: ProductVariant = {
      sku: buildVariantSku(formData.sku, comboMakerColor, comboMakerSize),
      barcode: "",
      size: comboMakerSize,
      color: comboMakerColor,
      price,
      costPrice: cost,
      stock,
      isActive: true,
    };

    setVariants((prev) => [...prev, newVariant]);

    // Ensure selected color and size reflect in parent chips
    if (!selectedColors.includes(comboMakerColor)) {
      setSelectedColors((prev) => [...prev, comboMakerColor]);
    }
    if (!selectedSizes.includes(comboMakerSize)) {
      setSelectedSizes((prev) => [...prev, comboMakerSize]);
    }

    setComboMakerPrice("");
    setComboMakerStock("");
  };

  // Bulk Apply Price for a specific color (e.g. Set all Black to ₹48.00)
  const handleBulkApplyPriceByColor = () => {
    if (!bulkColorTarget || !bulkPriceValue) return;
    const priceNum = parseFloat(bulkPriceValue);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Please enter a valid price");
      return;
    }

    setVariants((prev) =>
      prev.map((v) => {
        if (v.color.toLowerCase() === bulkColorTarget.toLowerCase()) {
          return { ...v, price: priceNum.toFixed(2) };
        }
        return v;
      })
    );
  };

  // Bulk Apply Price for a specific size (e.g. Set all XL to ₹42.00)
  const handleBulkApplyPriceBySize = () => {
    if (!bulkSizeTarget || !bulkSizePriceValue) return;
    const priceNum = parseFloat(bulkSizePriceValue);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Please enter a valid price");
      return;
    }

    setVariants((prev) =>
      prev.map((v) => {
        if (v.size.toLowerCase() === bulkSizeTarget.toLowerCase()) {
          return { ...v, price: priceNum.toFixed(2) };
        }
        return v;
      })
    );
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const nextActive = !product.isActive;
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product and all its variants?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Calculate total stock from variants
      const totalStock = variants.reduce(
        (sum, v) => sum + (parseInt(String(v.stock), 10) || 0),
        0
      );

      const payload = {
        ...formData,
        stock: totalStock || formData.stock,
        size: selectedSizes.join(", "),
        color: selectedColors.join(", "),
        variants: variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode || null,
          size: v.size,
          color: v.color,
          price: Number(v.price) || 0,
          costPrice: Number(v.costPrice) || 0,
          stock: parseInt(String(v.stock), 10) || 0,
          isActive: v.isActive,
        })),
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper to get color hex
  const getColorHex = (colorName: string) => {
    const found = PRESET_COLORS.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return found ? found.hex : "#94a3b8";
  };

  // Price Display Helper (Displays price range like "₹35.00 - ₹48.00" if variants have different prices)
  const renderProductPrice = (item: Product) => {
    if (!item.variants || item.variants.length === 0) {
      return (
        <span className="font-bold text-slate-900">
          ₹{Number(item.price).toFixed(2)}
        </span>
      );
    }

    const prices = item.variants.map((v) => Number(v.price)).filter((p) => !isNaN(p) && p > 0);
    if (prices.length === 0) {
      return (
        <span className="font-bold text-slate-900">
          ₹{Number(item.price).toFixed(2)}
        </span>
      );
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
      return (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">₹{min.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">All combos same</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <span className="font-extrabold text-indigo-700">
          ₹{min.toFixed(2)} – ₹{max.toFixed(2)}
        </span>
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm w-fit mt-0.5">
          Varies by Color/Size
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clothing Products & Variant Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage clothing inventory with individual size + color combo pricing, stock counts, and custom SKUs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name, SKU, Barcode, or Variant SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600"
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 truncate"
          >
            <option value="">All Categories</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
            <option value="Accessories">Accessories</option>
          </select>

          {/* Size Filter */}
          <select
            value={selectedSizeFilter}
            onChange={(e) => setSelectedSizeFilter(e.target.value)}
            className="w-full sm:w-32 px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 truncate"
          >
            <option value="">All Sizes</option>
            {PRESET_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                Size {sz}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table (White Card) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs">Loading products catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            {error && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice: {error} (Displaying fallback empty state)</span>
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Shirt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You don&apos;t have any products in your inventory yet. Get started by adding your first clothing item with custom color and size pricing combos!
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="min-w-[760px] w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Product & SKU</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Combos / Variants</th>
                  <th className="px-5 py-3.5">Price (Combos)</th>
                  <th className="px-5 py-3.5">Total Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((item) => {
                  const sizes = item.size
                    ? item.size.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  const colors = item.color
                    ? item.color.split(",").map((c) => c.trim()).filter(Boolean)
                    : [];
                  const variantCount = item.variants?.length || 0;
                  const isExpanded = expandedRowId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-2.5">
                            {variantCount > 0 && (
                              <button
                                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                className={`mt-0.5 p-1 rounded-md transition cursor-pointer ${
                                  isExpanded ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-slate-100"
                                }`}
                                title={isExpanded ? "Collapse combos" : "View size & color combos"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[11px] font-mono text-slate-400">
                                SKU: {item.sku}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {item.category}
                          </span>
                        </td>

                        {/* Combos & Variations Pill */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-1.5">
                            {/* Color swatches preview */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {colors.map((c, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium"
                                  title={`Color: ${c}`}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: getColorHex(c) }}
                                  ></span>
                                  <span>{c}</span>
                                </span>
                              ))}
                            </div>

                            {/* Size list + toggle combo button */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">
                                Sizes: {sizes.join(", ") || "Standard"}
                              </span>
                              {variantCount > 0 && (
                                <button
                                  onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                >
                                  {isExpanded ? "Hide Combos" : `(${variantCount} Combos)`}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price (Reflects Variant pricing range e.g. Black ₹48 vs Blue ₹38) */}
                        <td className="px-5 py-3.5">
                          {renderProductPrice(item)}
                        </td>

                        {/* Stock Quantity */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`font-semibold ${
                              item.stock > 5 ? "text-slate-800" : "text-amber-600 font-bold"
                            }`}
                          >
                            {item.stock} in stock
                          </span>
                          {variantCount > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Across {variantCount} combos
                            </div>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openViewModal(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="View product details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit product & variant prices"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Combos Drawer */}
                      {isExpanded && item.variants && item.variants.length > 0 && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={7} className="px-3 sm:px-8 py-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-indigo-600" />
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Size & Color Pricing Breakdown for {item.name}
                                  </h4>
                                </div>
                                <span className="text-[11px] text-slate-500">
                                  {item.variants.length} active combinations
                                </span>
                              </div>

                              <div className="overflow-x-auto touch-scroll">
                                <table className="min-w-[560px] w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                                    <tr>
                                      <th className="px-3 py-2">Color</th>
                                      <th className="px-3 py-2">Size</th>
                                      <th className="px-3 py-2">Variant Price</th>
                                      <th className="px-3 py-2">Cost</th>
                                      <th className="px-3 py-2">Stock</th>
                                      <th className="px-3 py-2">Variant SKU</th>
                                      <th className="px-3 py-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {item.variants.map((v) => (
                                      <tr key={v.id || v.sku} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2">
                                          <div className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                                            <span
                                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                              style={{ backgroundColor: getColorHex(v.color) }}
                                            ></span>
                                            <span>{v.color}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                                            {v.size}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 font-bold text-indigo-700">
                                          ₹{Number(v.price).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 text-slate-500">
                                          ₹{Number(v.costPrice || 0).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-slate-800">
                                          {v.stock} pcs
                                        </td>
                                        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                                          {v.sku}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                              v.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                            }`}
                                          >
                                            {v.isActive ? "Available" : "Disabled"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2.5 sm:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-indigo-600" />
                  <span>{editingProduct ? "Edit Clothing Product & Combos" : "Create Product with Size/Color Combos"}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure clothing sizes and colors, set unique pricing for each combo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto touch-scroll flex-1 space-y-5">
                {/* Product Core Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Premium Cotton Oxford Button-down Shirt"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Base SKU Code *
                      </label>
                      <button
                        type="button"
                        onClick={generateSku}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        title="Auto-generate SKU"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Auto-generate</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. OXF-SHIRT-01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Base Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Barcode / UPC (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 890123456789"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* --- SIZE SELECTOR SECTION --- */}
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1. Select Available Sizes</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {selectedSizes.length} selected: {selectedSizes.join(", ") || "None"}
                    </span>
                  </div>

                  {/* Size Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_SIZES.map((sz) => {
                      const isSelected = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Size */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      placeholder="Add custom size (e.g. 38, Free Size)..."
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 flex-1 focus:outline-none focus:border-indigo-600"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSize();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomSize}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      + Add Size
                    </button>
                  </div>
                </div>

                {/* --- COLOR SELECTOR SECTION --- */}
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Select Available Colors</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {selectedColors.length} selected: {selectedColors.join(", ") || "None"}
                    </span>
                  </div>

                  {/* Color Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_COLORS.map((col) => {
                      const isSelected = selectedColors.includes(col.name);
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => toggleColor(col.name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          ></span>
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Color */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="Add custom color (e.g. Teal, Khaki, Lavender)..."
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 flex-1 focus:outline-none focus:border-indigo-600"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomColor}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      + Add Color
                    </button>
                  </div>
                </div>

                {/* --- VARIANT COMBINATIONS & PRICING MATRIX --- */}
                <div className="border border-indigo-200 rounded-2xl bg-indigo-50/20 p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          3. Size & Color Pricing Matrix ({variants.length} Combinations)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Customize pricing, cost, and stock per color/size combo.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addManualVariant}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition cursor-pointer self-start"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Custom Combo</span>
                    </button>
                  </div>

                  {/* Direct Combo Creator Bar (Color & Size Dropdown) */}
                  <div className="bg-white border border-indigo-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Create Combo via Dropdowns:</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        (Select Color & Size to add a custom combo)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
                      {/* Color select dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Color *
                        </label>
                        <select
                          value={comboMakerColor}
                          onChange={(e) => setComboMakerColor(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 truncate"
                        >
                          <option value="">
                            {selectedColors.length === 0
                              ? "-- Select colors in Step 2 first --"
                              : "-- Select Color --"}
                          </option>
                          {selectedColors.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size select dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Size *
                        </label>
                        <select
                          value={comboMakerSize}
                          onChange={(e) => setComboMakerSize(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 truncate"
                        >
                          <option value="">
                            {selectedSizes.length === 0
                              ? "-- Select sizes in Step 1 first --"
                              : "-- Select Size --"}
                          </option>
                          {selectedSizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Price input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Price (₹)
                        </label>
                        <div className="relative w-full">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={formData.price || "0.00"}
                            value={comboMakerPrice}
                            onChange={(e) => setComboMakerPrice(e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      {/* Stock input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Stock
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={comboMakerStock}
                          onChange={(e) => setComboMakerStock(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={handleAddDirectCombo}
                        className="col-span-2 sm:col-span-1 w-full justify-center px-3.5 py-2 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Combo</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Set Price by Color & by Size */}
                  {variants.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Bulk Price by Color */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0">
                          <Palette className="w-3.5 h-3.5 text-indigo-600" />
                          <span>By Color:</span>
                        </span>
                        <select
                          value={bulkColorTarget}
                          onChange={(e) => setBulkColorTarget(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex-1 min-w-[90px] focus:outline-none"
                        >
                          <option value="">Select Color</option>
                          {matrixColors.map((c) => (
                            <option key={c} value={c}>
                              All &quot;{c}&quot;
                            </option>
                          ))}
                        </select>
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={bulkPriceValue}
                            onChange={(e) => setBulkPriceValue(e.target.value)}
                            className="w-full pl-5 pr-1 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleBulkApplyPriceByColor}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition"
                        >
                          Apply
                        </button>
                      </div>

                      {/* Bulk Price by Size */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0">
                          <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                          <span>By Size:</span>
                        </span>
                        <select
                          value={bulkSizeTarget}
                          onChange={(e) => setBulkSizeTarget(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex-1 min-w-[90px] focus:outline-none"
                        >
                          <option value="">Select Size</option>
                          {matrixSizes.map((s) => (
                            <option key={s} value={s}>
                              All &quot;{s}&quot;
                            </option>
                          ))}
                        </select>
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={bulkSizePriceValue}
                            onChange={(e) => setBulkSizePriceValue(e.target.value)}
                            className="w-full pl-5 pr-1 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleBulkApplyPriceBySize}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Variants List Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {variants.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No combinations added yet</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Use &quot;Create Combo via Dropdowns&quot; above to manually add your desired combinations.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-72 touch-scroll">
                        <table className="min-w-[580px] w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2.5">Combo (Color / Size)</th>
                              <th className="px-3 py-2.5">Selling Price (₹) *</th>
                              <th className="px-3 py-2.5">Cost (₹)</th>
                              <th className="px-3 py-2.5">Stock</th>
                              <th className="px-3 py-2.5">Variant SKU</th>
                              <th className="px-3 py-2.5 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {variants.map((v, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                {/* Color and Size Combo Dropdowns */}
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                      style={{ backgroundColor: getColorHex(v.color) }}
                                      title={v.color}
                                    ></span>
                                    <select
                                      value={v.color}
                                      onChange={(e) => {
                                        const newCol = e.target.value;
                                        updateVariantItem(idx, "color", newCol);
                                        updateVariantItem(
                                          idx,
                                          "sku",
                                          buildVariantSku(formData.sku, newCol, v.size)
                                        );
                                      }}
                                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600"
                                    >
                                      {Array.from(new Set([v.color, ...selectedColors].filter(Boolean))).map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={v.size}
                                      onChange={(e) => {
                                        const newSz = e.target.value;
                                        updateVariantItem(idx, "size", newSz);
                                        updateVariantItem(
                                          idx,
                                          "sku",
                                          buildVariantSku(formData.sku, v.color, newSz)
                                        );
                                      }}
                                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600"
                                    >
                                      {Array.from(new Set([v.size, ...selectedSizes].filter(Boolean))).map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </td>

                                {/* Price Input (Different per color/size) */}
                                <td className="px-3 py-2">
                                  <div className="relative w-28">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      value={v.price}
                                      onChange={(e) => updateVariantItem(idx, "price", e.target.value)}
                                      placeholder="0.00"
                                      className="w-full pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                </td>

                                {/* Cost Price */}
                                <td className="px-3 py-2">
                                  <div className="relative w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₹</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={v.costPrice}
                                      onChange={(e) => updateVariantItem(idx, "costPrice", e.target.value)}
                                      placeholder="0.00"
                                      className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                </td>

                                {/* Stock Input */}
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    required
                                    value={v.stock}
                                    onChange={(e) => updateVariantItem(idx, "stock", e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                                  />
                                </td>

                                {/* Variant SKU */}
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) => updateVariantItem(idx, "sku", e.target.value.toUpperCase())}
                                    className="w-36 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 uppercase focus:bg-white focus:outline-none focus:border-indigo-600"
                                  />
                                </td>

                                {/* Remove combo */}
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeVariantItem(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Remove this combination"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* isActive Field */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Product is Active and available for sale in POS
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex flex-col-reverse xs:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
                <div className="text-xs text-slate-500 text-center xs:text-left">
                  Total inventory: <span className="font-bold text-slate-800">{variants.reduce((acc, v) => acc + (parseInt(String(v.stock), 10) || 0), 0)} units</span> across {variants.length} combos
                </div>
                <div className="flex items-center gap-2.5 w-full xs:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 xs:flex-none px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 xs:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingProduct ? "Update Product & Combos" : "Save Product & Combos"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product View Details Modal */}
      {isViewModalOpen && viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2.5 sm:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {viewingProduct.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {viewingProduct.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      Base SKU: <span className="text-slate-800 font-bold">{viewingProduct.sku}</span>
                    </span>
                    {viewingProduct.barcode && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-mono">
                          Barcode: {viewingProduct.barcode}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingProduct(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto touch-scroll flex-1 space-y-5">
              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Selling Price
                  </span>
                  <div className="text-base font-extrabold text-indigo-600">
                    {renderProductPrice(viewingProduct)}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cost Price
                  </span>
                  <div className="text-base font-bold text-slate-700">
                    ₹{Number(viewingProduct.costPrice || 0).toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Inventory
                  </span>
                  <div className="text-base font-extrabold text-slate-900">
                    {viewingProduct.stock} <span className="text-xs font-normal text-slate-500">pcs</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    POS Status
                  </span>
                  <div>
                    {viewingProduct.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sizes and Colors Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Available Sizes */}
                <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Ruler className="w-4 h-4 text-indigo-600" />
                    <span>Available Sizes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProduct.size ? (
                      viewingProduct.size.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific sizes configured</span>
                    )}
                  </div>
                </div>

                {/* Available Colors */}
                <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>Available Colors</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProduct.color ? (
                      viewingProduct.color.split(",").map((c) => c.trim()).filter(Boolean).map((c) => (
                        <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: getColorHex(c) }}
                          />
                          <span>{c}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific colors configured</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Variants Matrix Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Size & Color Combinations ({viewingProduct.variants?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Individual stock & price per combination
                  </span>
                </div>

                {(!viewingProduct.variants || viewingProduct.variants.length === 0) ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                    No individual combinations configured for this product.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-64 touch-scroll">
                      <table className="min-w-[560px] w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5">Color</th>
                            <th className="px-3.5 py-2.5">Size</th>
                            <th className="px-3.5 py-2.5">Variant SKU</th>
                            <th className="px-3.5 py-2.5">Price</th>
                            <th className="px-3.5 py-2.5">Cost</th>
                            <th className="px-3.5 py-2.5">Stock</th>
                            <th className="px-3.5 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                          {viewingProduct.variants.map((v) => (
                            <tr key={v.id || v.sku} className="hover:bg-slate-50/70">
                              <td className="px-3.5 py-2">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: getColorHex(v.color) }}
                                  />
                                  <span>{v.color}</span>
                                </div>
                              </td>
                              <td className="px-3.5 py-2">
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                                  {v.size}
                                </span>
                              </td>
                              <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500 font-semibold">
                                {v.sku}
                              </td>
                              <td className="px-3.5 py-2 font-bold text-indigo-700">
                                ₹{Number(v.price).toFixed(2)}
                              </td>
                              <td className="px-3.5 py-2 text-slate-500">
                                ₹{Number(v.costPrice || 0).toFixed(2)}
                              </td>
                              <td className="px-3.5 py-2 font-bold text-slate-900">
                                {v.stock} pcs
                              </td>
                              <td className="px-3.5 py-2">
                                {v.isActive ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse xs:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
              <span className="text-xs text-slate-400 text-center xs:text-left">
                Created on {new Date(viewingProduct.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setViewingProduct(null);
                  }}
                  className="flex-1 xs:flex-none px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleEditFromView}
                  className="flex-1 xs:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
