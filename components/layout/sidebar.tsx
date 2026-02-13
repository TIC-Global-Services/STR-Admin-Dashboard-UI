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
  Menu,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    if (!user) return false;
    if (user.roles?.includes("SUPER_ADMIN")) return true;
    return user.permissions?.includes(permission);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      // Even if response is not ok, we usually still want to redirect to login
      router.push("/login");
      router.refresh(); // Optional: helps clear any cached data
    } catch (err) {
      console.error("Logout failed:", err);
      // Still redirect even on error (best effort)
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <Image
          src="/STR_Logo.png"
          alt="STR Logo"
          width={120}
          height={40}
          className="object-contain"
        />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X size={24} className="text-gray-600" />
          ) : (
            <Menu size={24} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col font-halfre z-50 transition-transform duration-300 ease-in-out
          lg:w-[20%] lg:translate-x-0
          w-[280px] 
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo - Hidden on mobile */}
        <div className="hidden lg:flex items-start justify-start pt-8 px-2">
          <Image
            src="/STR_Logo.png"
            alt="STR Logo"
            width={200}
            height={200}
            className="object-cover"
          />
        </div>

        {/* Mobile Logo Spacer */}
        <div className="lg:hidden h-6" />

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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base lg:text-lg font-medium transition-all
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
            className="w-full flex items-center cursor-pointer gap-3 px-4 py-3 rounded-lg text-base lg:text-lg font-medium text-red-600 hover:bg-red-50 transition-all"
            disabled={isLoggingOut}
          >
            <LogOut size={20} className="text-red-500" />
            Logout
          </button>

          {/* Developed By */}
          <div className="text-center text-xs lg:text-sm text-gray-400">
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[400px] p-6">
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
                disabled={isLoggingOut}
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`
                  px-4 py-2 rounded-lg cursor-pointer min-w-[110px] flex items-center justify-center gap-2
                  ${isLoggingOut 
                    ? "bg-red-400 cursor-not-allowed" 
                    : "bg-red-600 hover:bg-red-700"
                  }
                  text-white transition-colors
                `}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Logging out...
                  </>
                ) : (
                  "Yes, Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}