"use client";

import React, { useState, useEffect } from "react";
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
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminShellProps {
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
  };
  children: React.ReactNode;
}

export default function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased">
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR (visible on lg: 1024px and above)     */}
      {/* ========================================================= */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
          desktopCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top Brand Header with Menu Icon */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/dashboard"
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0 hover:bg-indigo-700 transition"
              title="Clothing POS Admin"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>
            {!desktopCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 tracking-tight text-sm leading-tight truncate">
                  Clothing POS
                </h1>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Admin Portal
                </p>
              </div>
            )}
          </div>

          {/* Menu icon button inside the sidebar to open/close or collapse it */}
          <button
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition cursor-pointer flex items-center justify-center"
            title={desktopCollapsed ? "Expand sidebar" : "Collapse / Close sidebar"}
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          {!desktopCollapsed && (
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
                } ${desktopCollapsed ? "justify-center px-0" : ""}`}
                title={desktopCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                {!desktopCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-100">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all ${
                desktopCollapsed ? "justify-center px-0" : ""
              }`}
              title="Storefront Portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!desktopCollapsed && <span>Storefront Portal</span>}
            </Link>
          </div>
        </div>

        {/* Desktop Bottom Profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
          {!desktopCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-2.5 px-1">
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

              <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs mb-2.5">
                <p className="text-xs font-bold text-slate-900 truncate">{admin.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{admin.email}</p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:bg-rose-100 text-slate-600 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
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

      {/* ========================================================= */}
      {/* 2. MOBILE DRAWER OVERLAY & PANEL (< lg: 1024px)          */}
      {/* ========================================================= */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 ease-out"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden select-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Drawer Header with Menu toggle icon */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">
                Clothing POS
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Admin Portal</p>
            </div>
          </div>

          {/* Menu icon button inside mobile sidebar to close it */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition cursor-pointer flex items-center justify-center"
            aria-label="Close sidebar menu"
            title="Close sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation List */}
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Management
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Storefront Portal</span>
            </Link>
          </div>
        </div>

        {/* Mobile Bottom Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between mb-2.5 px-1">
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

          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs mb-2.5">
            <p className="text-xs font-bold text-slate-900 truncate">{admin.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{admin.email}</p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:bg-rose-100 text-slate-600 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{loggingOut ? "Signing out..." : "Log Out"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT AREA & HEADER                            */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Menu icon button to open/toggle sidebar on mobile/tablet AND desktop */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileOpen(!mobileOpen);
                } else {
                  setDesktopCollapsed(!desktopCollapsed);
                }
              }}
              className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition cursor-pointer flex items-center justify-center"
              aria-label="Toggle sidebar menu"
              title="Open / Close Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand indicator */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                Clothing POS
              </span>
            </div>

            {/* Desktop Workspace Title */}
            <div className="hidden lg:block">
              <h2 className="text-sm font-semibold text-slate-700">
                Admin Workspace
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="hidden xs:inline">POS Ready</span>
            </div>

            {/* Admin initials or badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {admin.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {admin.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body with responsive padding */}
        <main className="p-3 xs:p-4 sm:p-6 lg:p-8 flex-1 max-w-full overflow-x-hidden touch-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
