
'use client';

import React, { useState, useEffect } from 'react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Users,
  Clock,
  Calendar,
  Wallet,
  Star,
  Briefcase,
  BookUser,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Building,
  MapPin,
  User as UserIcon,
  BarChart,
  TriangleAlert,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type User = {
  id: number;
  username: string;
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: User['role'][];
};

type NavGroup = {
  title?: string;
  items: NavItem[];
  roles?: User['role'][];
}

const navConfig: (NavGroup | { separator: true })[] = [
  {
    items: [
      { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
      { href: '/employees', label: 'الموظفين', icon: Users, roles: ['Admin', 'HR', 'Manager'] },
    ],
  },
  { separator: true },
  {
    title: 'البيانات الرئيسية',
    roles: ['Admin', 'HR'],
    items: [
      { href: '/departments', label: 'الأقسام', icon: Building },
      { href: '/locations', label: 'المواقع', icon: MapPin },
    ],
  },
  { separator: true },
  {
    title: 'العمليات اليومية',
    items: [
      { href: '/attendance', label: 'الحضورو الانصراف', icon: Clock },
      { href: '/leaves', label: 'الإجازات', icon: Calendar },
      { href: '/disciplinary', label: 'الإجراءات التأديبية', icon: TriangleAlert, roles: ['Admin', 'HR', 'Manager'] },
    ],
  },
  { separator: true },
  {
    title: 'الرواتب والتحليل',
    items: [
      { href: '/payroll', label: 'الرواتب', icon: Wallet },
      { href: '/performance', label: 'الأداء', icon: Star },
      { href: '/reports', label: 'التقارير', icon: BarChart, roles: ['Admin', 'HR', 'Manager'] },
    ]
  },
  { separator: true },
  {
    title: 'التوظيف والتطوير',
    items: [
      { href: '/recruitment', label: 'التوظيف', icon: Briefcase },
      { href: '/training', label: 'التدريب', icon: BookUser },
    ]
  },
  { separator: true },
  {
    title: 'النظام',
    items: [
      { href: '/audit-log', label: 'سجل التدقيق', icon: ShieldCheck, roles: ['Admin'] },
      { href: '/account', label: 'حسابي', icon: UserIcon },
      { href: '/settings', label: 'الإعدادات', icon: Settings, roles: ['Admin'] },
    ]
  }
];

const getVisibleNavItems = (userRole: User['role']) => {
  return navConfig.map(group => {
    if ('separator' in group) {
      return group;
    }

    if (group.roles && !group.roles.includes(userRole)) {
      return null;
    }

    const visibleItems = group.items.filter(item => 
      !item.roles || item.roles.includes(userRole)
    );

    if (visibleItems.length === 0) {
      return null;
    }

    return { ...group, items: visibleItems };
  }).filter(Boolean);
};


export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        setUser(null);
      }
    }
  }, []);

  const visibleNav = user ? getVisibleNavItems(user.role) : [];

  return (
    <SidebarMenu>
      {visibleNav.map((group, index) => {
        if (!group) return null;
        
        if ('separator' in group) {
          // Check if there are visible items before and after the separator
          const hasVisibleItemsBefore = index > 0 && visibleNav[index - 1] && !('separator' in (visibleNav[index-1]!));
          const hasVisibleItemsAfter = index < visibleNav.length - 1 && visibleNav[index + 1] && !('separator' in (visibleNav[index+1]!));
          if (!hasVisibleItemsBefore || !hasVisibleItemsAfter) {
            return null;
          }
          return <SidebarMenuItem key={`sep-${index}`} className="!p-0"><SidebarSeparator className="my-2" /></SidebarMenuItem>;
        }
        
        return (
          <React.Fragment key={group.title || `group-${index}`}>
            {group.title && (
              <SidebarMenuItem>
                <div className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  {group.title}
                </div>
              </SidebarMenuItem>
            )}
            {group.items.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </React.Fragment>
        )
      })}
    </SidebarMenu>
  );
}
