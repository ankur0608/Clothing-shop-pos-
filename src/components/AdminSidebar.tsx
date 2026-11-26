"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  LayoutDashboard,
  Shirt,
  TicketPercent,
  LogOut,
  Loader2,
  ClipboardList,
  Menu,
  ScanLine,
  Receipt,
} from "lucide-react";

interface AdminSidebarProps {
  admin: {
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
  };
}

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "POS Billing",
      href: "/admin/pos",
      icon: ScanLine,
    },
    {
      label: "Sales & Invoices",
      href: "/admin/orders",
      icon: Receipt,
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: Shirt,
    },
    {
      label: "Coupons",
      href: "/admin/coupons",
      icon: TicketPercent,
    },
    {
      label: "Admin Logs",
      href: "/admin/logs",
      icon: ClipboardList,
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Brand & Nav */}
      <div>
        {/* Brand with Menu Icon */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 tracking-tight text-sm leading-tight truncate">
                  Clothing POS
                </h1>
                <p className="text-[11px] text-slate-400 font-medium truncate">Admin Portal</p>
              </div>
            )}
          </div>

          {/* Menu icon button inside sidebar to toggle open/close */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
            title={collapsed ? "Open Sidebar" : "Close Sidebar"}
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Management
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {admin.isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      admin.isOnline ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  ></span>
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {admin.isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {admin.role}
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs mb-2">
              <p className="text-xs font-bold text-slate-900 truncate">{admin.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{admin.email}</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>{loggingOut ? "Signing out..." : "Log Out"}</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center cursor-default"
              title={`${admin.name} (${admin.email})`}
            >
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Log Out"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
