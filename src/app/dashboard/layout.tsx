'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Globe, 
  LayoutDashboard, 
  FileText, 
  Workflow, 
  Settings, 
  Key,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/dashboard/jobs', icon: FileText },
  { name: 'Workflows', href: '/dashboard/workflows', icon: Workflow },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-bold">ScrapeFlow</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-1">Free Plan</p>
            <p className="text-xs text-muted-foreground mb-3">100 scrapes/month</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '23%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">23 / 100 used</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <button className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'G'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-border">
                        {session?.user ? (
                          <>
                            <p className="font-medium truncate">{session.user.name || 'User'}</p>
                            <p className="text-sm text-muted-foreground truncate">{session.user.email}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Guest Mode</p>
                        )}
                      </div>
                      <div className="p-2">
                        {session?.user ? (
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-secondary rounded-lg"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        ) : (
                          <Link
                            href="/auth/login"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-lg"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LogIn className="h-4 w-4" />
                            Sign In
                          </Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
