import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Shirt,
  TicketPercent,
  Package,
  ArrowRight,
  Plus,
  Shield,
  Layers,
  CheckCircle2,
  Tag,
  ScanLine,
  Receipt,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) return null;

  // Fetch store stats and recent products (no admin session logs here)
  const [admin, productCount, couponCount, recentProducts] = await Promise.all([
    prisma.admin.findUnique({
      where: { id: session.admin.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.product.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.product.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            price: true,
            stock: true,
          },
        },
      },
    }),
  ]);

  if (!admin) return null;

  // Compute total inventory stock across products
  const totalStock = recentProducts.reduce((sum, p) => {
    if (p.variants && p.variants.length > 0) {
      return sum + p.variants.reduce((vSum, v) => vSum + (Number(v.stock) || 0), 0);
    }
    return sum + (Number(p.stock) || 0);
  }, 0);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
            POS Control Center
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Welcome back, {admin.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your store inventory, discount coupons, and color/size pricing combinations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            href="/admin/pos"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition"
          >
            <ScanLine className="w-4 h-4 shrink-0" />
            <span>Launch POS Billing</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition"
          >
            <Receipt className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Sales History</span>
          </Link>
          <Link
            href="/admin/products"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Products</span>
          </Link>
        </div>
      </div>

      {/* Store Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Metric 1: Products */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Products
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Shirt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{productCount}</p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-3"
          >
            <span>View catalog</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Metric 2: Active Coupons */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Coupons
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TicketPercent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{couponCount}</p>
          </div>
          <Link
            href="/admin/coupons"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-3"
          >
            <span>Manage discounts</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Metric 3: Total Inventory Units */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Inventory Units
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalStock}{" "}
              <span className="text-xs font-medium text-slate-400">units</span>
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold mt-3"
          >
            <span>Check stock levels</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Metric 4: System & Security Logs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Security & Audit
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900">
              Session Logs
            </p>
          </div>
          <Link
            href="/admin/logs"
            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-semibold mt-3"
          >
            <span>View Admin Logs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Catalog Products Overview */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Shirt className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span>Recently Added Catalog Products</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Overview of recent inventory items and their size/color variations.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition self-start sm:self-auto"
          >
            View All Products &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 touch-scroll">
          <table className="min-w-[620px] w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] sm:text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Combos</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentProducts.length > 0 ? (
                recentProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {prod.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {prod.sku}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{prod.variants.length} combinations</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      ₹{Number(prod.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          prod.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {prod.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No products added yet. Click &quot;Manage Products&quot; to add your first item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
