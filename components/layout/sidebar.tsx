"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Newspaper,
  Share2,
  BarChart3,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface UserPayload {
  roles: string[];
  permissions: string[];
}

interface SidebarProps {
  user: UserPayload | null;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    name: "Memberships",
    href: "/dashboard/membership",
    icon: Users,
    permission: "MEMBERSHIP_APPROVE",
  },
  {
    name: "News and Events",
    href: "/dashboard/news",
    icon: Newspaper,
    permission: "NEWS_CREATE",
  },
  {
    name: "Social Settings",
    href: "/dashboard/social",
    icon: Share2,
    permission: "SOCIAL_EMBED_UPDATE",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    permission: "ANALYTICS_VIEW",
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    permission: "ROLE_ASSIGN",
  },
  {
    name: "Audit Logs",
    href: "/dashboard/audit",
    icon: FileText,
    permission: "USER_VIEW",
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    if (!user) return false;
    if (user.roles?.includes("SUPER_ADMIN")) return true;
    return user.permissions?.includes(permission);
  };

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.push("/login");
  };

  return (
    <>
      <aside className="w-[20%] h-screen fixed bg-white border-r border-gray-200 flex flex-col font-halfre">
        {/* Logo */}
        <div className="flex items-start justify-start pt-8 px-2">
          <Image
            src="/STR_Logo.png"
            alt="STR Logo"
            width={200}
            height={200}
            className="object-cover"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigation
              .filter((item) => hasPermission(item.permission))
              .map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-all
              ${
                isActive
                  ? "bg-green-50 text-green-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
                  >
                    <Icon
                      size={20}
                      className={isActive ? "text-green-600" : "text-gray-500"}
                    />
                    {item.name}
                  </Link>
                );
              })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="px-4 pb-6 space-y-4 border-t border-gray-100 pt-4">
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center cursor-pointer gap-3 px-4 py-3 rounded-lg text-lg font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} className="text-red-500" />
            Logout
          </button>

          {/* Developed By */}
          <div className="text-center text-sm text-gray-400">
            Developed by{" "}
            <a
              href="https://ticglobalservices.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-medium"
            >
              TIC Global Services
            </a>
          </div>
        </div>
      </aside>

      {/* 🔥 Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Logout
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border cursor-pointer border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg cursor-pointer bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
