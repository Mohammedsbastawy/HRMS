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
  { href: '/employees', label: 'الموظفين', icon: Users, separator: true },
  { href: '/departments', label: 'الأقسام', icon: Building },
  { href: '/locations', label: 'المواقع', icon: MapPin, separator: true },
  { href: '/attendance', label: 'الحضور', icon: Clock },
  { href: '/leaves', label: 'الإجازات', icon: Calendar, separator: true },
  { href: '/payroll', label: 'الرواتب', icon: Wallet },
  { href: '/performance', label: 'الأداء', icon: Star, separator: true },
  { href: '/recruitment', label: 'التوظيف', icon: Briefcase },
  { href: '/training', label: 'التدريب', icon: BookUser, separator: true },
  { href: '/audit-log', label: 'سجل التدقيق', icon: ShieldCheck },
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
