'use client';

import React from 'react';
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
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  separator?: boolean;
};

const navItems: NavItem[] = [
  { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/employees', label: 'الموظفين', icon: Users },
  { href: '/departments', label: 'الأقسام', icon: Building, separator: true },
  { href: '/locations', label: 'المواقع', icon: MapPin },
  { href: '/attendance', label: 'الحضور', icon: Clock, separator: true },
  { href: '/leaves', label: 'الإجازات', icon: Calendar },
  { href: '/payroll', label: 'الرواتب', icon: Wallet, separator: true },
  { href: '/performance', label: 'الأداء', icon: Star },
  { href: '/recruitment', label: 'التوظيف', icon: Briefcase, separator: true },
  { href: '/training', label: 'التدريب', icon: BookUser },
  { href: '/audit-log', label: 'سجل التدقيق', icon: ShieldCheck, separator: true },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <React.Fragment key={item.href}>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {item.separator && <SidebarSeparator className="my-2" />}
        </React.Fragment>
      ))}
    </SidebarMenu>
  );
}
