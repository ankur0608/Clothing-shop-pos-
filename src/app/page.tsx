import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  TicketPercent,
  Clock,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getAdminSession();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 text-slate-800 flex flex-col justify-center items-center px-4 py-8 sm:py-16 font-sans">
      <div className="max-w-md w-full text-center space-y-6 sm:space-y-7">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
          <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Smart Retail POS System</span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Clothing Shop POS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Point of Sale Administration, Inventory Catalog, Variant Combos & Promotional Coupons
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-2.5 text-left">
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Color & Size Matrix</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Individual pricing & inventory stock per color/size combo.
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <TicketPercent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Discounts & Coupons</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configurable percentage and flat rupee discounts with usage limits.
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Session Audit Logs</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Live administrator presence and secure timestamped session tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {session ? (
            <Link
              href="/admin/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
            >
              <Activity className="w-4 h-4" />
              <span>Go to Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Access Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400">
          Clothing Shop POS System • Secure Enterprise Retail Portal
        </p>
      </div>
    </div>
  );
}
