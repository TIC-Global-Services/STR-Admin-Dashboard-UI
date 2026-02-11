'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '/dashboard.png' },
  { name: 'User management', href: '/dashboard/users', icon: '/user.png' },
  { name: 'News and Events', href: '/dashboard/news', icon: '/newsandevents.png' },
  { name: 'Social settings', href: '/dashboard/social', icon: '/socialsettings.png' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: '/analytics.png' },
  { name: 'System settings', href: '/dashboard/settings', icon: '/systemsettings.png' },
  { name: 'Audit logs', href: '/dashboard/audit', icon: '/auditlogs.png' },
  { name: 'Delete Account', href: '/dashboard/delete-account', icon: '/deleteacc.png' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-72 bg-white min-h-screen border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center py-8">
        <Image 
          src="/str.png" 
          alt="STR Logo" 
          width={120} 
          height={120}
          className="object-contain"
        />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-6 py-4">
        <div className="space-y-1">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? 'text-green-600 bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Image 
                    src={item.icon} 
                    alt={item.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span>{item.name}</span>
                </Link>
                {index < navigation.length - 1 && (
                  <div className="my-2 border-b border-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
