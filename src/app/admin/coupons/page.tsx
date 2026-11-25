"use client";

import React, { useEffect, useState } from "react";
import {
  TicketPercent,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  Percent,
  IndianRupee,
  Users,
  X,
  Sparkles,
  Infinity,
  Shuffle,
  Pencil,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string | number;
  minOrderAmount: string | number | null;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialFormState = {
    code: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: "",
    minOrderAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    neverExpires: false,
    usageLimit: "",
    isUnlimited: false,
    isActive: true,
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    const neverExp = isNeverExpires(coupon.endDate);
    const unlim = isUnlimitedUsage(coupon.usageLimit);

    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
      startDate: coupon.startDate
        ? new Date(coupon.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      endDate: neverExp
        ? ""
        : coupon.endDate
        ? new Date(coupon.endDate).toISOString().split("T")[0]
        : "",
      neverExpires: neverExp,
      usageLimit: unlim ? "" : String(coupon.usageLimit),
      isUnlimited: unlim,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const generateCouponCode = () => {
    const prefixes = ["SAVE", "DEAL", "OFFER", "FESTIVE", "SPECIAL", "SUPER", "VIP", "FLAT", "MEGA", "BONUS"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = parseInt(formData.discountValue, 10);
    const valuePart = !isNaN(val) && val > 0 ? String(val) : "";
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `${randomPrefix}${valuePart}-${randomChars}`;

    setFormData((prev) => ({
      ...prev,
      code: newCode,
      description: prev.description.trim() ? prev.description : `Special ${randomPrefix} discount voucher`,
    }));
  };

  const isNeverExpires = (dateStr: string) => {
    if (!dateStr) return true;
    const year = new Date(dateStr).getFullYear();
    return year >= 2099;
  };

  const isUnlimitedUsage = (limit: number) => {
    return limit === 0 || limit >= 999999;
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setError(err.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const nextActive = !coupon.isActive;
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextActive } : c))
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : "/api/admin/coupons";
      const method = editingCoupon ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsModalOpen(false);
      setEditingCoupon(null);
      setFormData(initialFormState);
      fetchCoupons();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Discount Coupons & Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create promotional codes, configure expiration dates, usage limits, and active status.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table (White Card) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs">Loading coupons...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <TicketPercent className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No discount coupons yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create discount coupons for seasonal sales, customer rewards, or clearance events.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="min-w-[700px] w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Coupon Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Valid Dates</th>
                  <th className="px-5 py-3.5">Usage Count</th>
                  <th className="px-5 py-3.5">Active Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coupons.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                        <TicketPercent className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{item.code}</span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-slate-900">
                        {item.discountType === "PERCENTAGE"
                          ? `${Number(item.discountValue)}% OFF`
                          : `₹${Number(item.discountValue)} FLAT`}
                      </span>
                      {Number(item.minOrderAmount) > 0 && (
                        <p className="text-[11px] text-slate-400">
                          Min: ₹{Number(item.minOrderAmount)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {isNeverExpires(item.endDate) ? (
                        <div className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full text-[11px]">
                          <Infinity className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Never Expires</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Until {formatDate(item.endDate)}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Started: {formatDate(item.startDate)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* How many times used count */}
                      {isUnlimitedUsage(item.usageLimit) ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{item.usedCount} used</span>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Infinity className="w-3 h-3 text-indigo-600" />
                              <span>No Limit</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Unlimited users</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-slate-800">
                              {item.usedCount} / {item.usageLimit}
                            </div>
                            <span className="text-[11px] text-slate-400">used</span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.usedCount / (item.usageLimit || 1)) * 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Active Key Status Toggle */}
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
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit coupon"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2.5 sm:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingCoupon
                    ? "Update promotional code, discount rates, and validity settings."
                    : "Set discount rates, expiration date, and maximum usage count."}
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

            <form onSubmit={handleSaveCoupon} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto touch-scroll flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Coupon Code *
                      </label>
                      <button
                        type="button"
                        onClick={generateCouponCode}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        title="Auto-generate random coupon code"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Auto-generate</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. SUMMER25"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as "PERCENTAGE" | "FIXED",
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Flat Rupee (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value })
                      }
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min Order Spend (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, minOrderAmount: e.target.value })
                      }
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Expiration Date with Never Expires toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Expiration Date *
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.neverExpires}
                          onChange={(e) =>
                            setFormData({ ...formData, neverExpires: e.target.checked })
                          }
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                        />
                        <span>Never Expires</span>
                      </label>
                    </div>
                    {formData.neverExpires ? (
                      <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 h-[38px]">
                        <Infinity className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Lifetime validity (No expiration)</span>
                      </div>
                    ) : (
                      <input
                        type="date"
                        required={!formData.neverExpires}
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    )}
                  </div>

                  {/* How many times used / usage limit with Unlimited toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Total Times Usable (Limit) *
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.isUnlimited}
                          onChange={(e) =>
                            setFormData({ ...formData, isUnlimited: e.target.checked })
                          }
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                        <span>No Limit</span>
                      </label>
                    </div>
                    {formData.isUnlimited ? (
                      <div className="w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800 flex items-center gap-2 h-[38px]">
                        <Infinity className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Unlimited (No user limit)</span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        required={!formData.isUnlimited}
                        min="1"
                        value={formData.usageLimit}
                        onChange={(e) =>
                          setFormData({ ...formData, usageLimit: e.target.value })
                        }
                        placeholder="e.g. 100"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="e.g. 15% off for all Summer apparel purchases"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* isActive Field */}
                  <div className="sm:col-span-2 pt-1">
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
                        Coupon is Active and redeemable at checkout
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex flex-col-reverse xs:flex-row items-center justify-end gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full xs:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full xs:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCoupon ? "Save Changes" : "Create Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
