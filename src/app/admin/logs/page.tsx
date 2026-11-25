import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Shield,
  Activity,
  Clock,
  Laptop,
  CheckCircle2,
  Wifi,
  Calendar,
  ArrowLeft,
  User,
  Hash,
  Globe,
  Terminal,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch admin and full session audit logs
  const [admin, logs, totalLogsCount] = await Promise.all([
    prisma.admin.findUnique({
      where: { id: session.admin.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        isActive: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
      },
    }),
    prisma.adminLoginLog.findMany({
      where: { adminId: session.admin.id },
      orderBy: { loginAt: "desc" },
      take: 100,
    }),
    prisma.adminLoginLog.count({
      where: { adminId: session.admin.id },
    }),
  ]);

  if (!admin) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = (start: Date, end: Date | null) => {
    if (!end) return "Active / Ongoing";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return "< 1 min";
    const diffSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-600" />
            <span>Admin Activity & Session Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit history recording exact administrator login/logout timestamps, session durations, IP addresses, and device info.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>{totalLogsCount} Total Sessions Logged</span>
          </span>
        </div>
      </div>

      {/* Admin Profile & Status Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Admin Profile */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Administrator
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">{admin.name}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{admin.email}</p>
          <div className="mt-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {admin.role}
            </span>
          </div>
        </div>

        {/* Card 2: Current Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Presence Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {admin.isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Online
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-600">Offline</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Account is {admin.isActive ? "Active & Authorized" : "Disabled"}
          </p>
        </div>

        {/* Card 3: Last Login Time */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Current / Last Login
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-900 leading-snug">
            {formatDate(admin.lastLoginAt)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Session expiration: 1 hour
          </p>
        </div>

        {/* Card 4: Previous Logout Time */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Previous Logout
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-900 leading-snug">
            {formatDate(admin.lastLogoutAt)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Member since: {formatDate(admin.createdAt)}
          </p>
        </div>
      </div>

      {/* Complete Login Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Full Administrator Session Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of all successful logins, logout times, IP addresses, and client devices.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Showing latest {logs.length} sessions
          </span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="min-w-[700px] w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Login Time</th>
                <th className="px-5 py-3.5">Logout Time</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Device & User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Login Timestamp */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(log.loginAt)}
                    </td>

                    {/* Logout Timestamp */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {log.logoutAt ? (
                        <span className="text-slate-600 font-medium">
                          {formatDate(log.logoutAt)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active Session
                        </span>
                      )}
                    </td>

                    {/* Session Duration */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-600">
                        {calculateDuration(log.loginAt, log.logoutAt)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          log.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : log.status === "EXPIRED"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {log.status === "ACTIVE"
                          ? "Active Now"
                          : log.status === "LOGGED_OUT"
                          ? "Logged Out"
                          : log.status}
                      </span>
                    </td>

                    {/* IP Address */}
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.ipAddress || "127.0.0.1"}</span>
                      </span>
                    </td>

                    {/* Device / Client */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-sm truncate">
                      <span className="inline-flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={log.userAgent || "Desktop Browser"}>
                          {log.userAgent || "Desktop Browser"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No session logs found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New login sessions will be recorded here automatically.
                    </p>
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
