
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
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
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const navConfig: NavGroup[] = [
  {
    items: [
      { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
      { href: '/employees', label: 'الموظفين', icon: Users },
    ],
  },
  {
    title: 'البيانات الأساسية',
    items: [
      { href: '/departments', label: 'الأقسام', icon: Building },
      { href: '/locations', label: 'المواقع', icon: MapPin },
    ],
  },
  {
    title: 'العمليات اليومية',
    items: [
      { href: '/attendance', label: 'الحضور', icon: Clock },
      { href: '/leaves', label: 'الإجازات', icon: Calendar },
    ],
  },
  {
    title: 'المالية والأداء',
    items: [
      { href: '/payroll', label: 'الرواتب', icon: Wallet },
      { href: '/performance', label: 'الأداء', icon: Star },
    ],
  },
  {
    title: 'النمو والتطوير',
    items: [
      { href: '/recruitment', label: 'التوظيف', icon: Briefcase },
      { href: '/training', label: 'التدريب', icon: BookUser },
    ],
  },
  {
    title: 'النظام',
    items: [
      { href: '/audit-log', label: 'سجل التدقيق', icon: ShieldCheck },
      { href: '/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];


export function Nav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navConfig.map((group, index) => (
        <SidebarGroup key={index}>
          {group.title && (
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          )}
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
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
          ))}
        </SidebarGroup>
      ))}
    </SidebarMenu>
  );
}
