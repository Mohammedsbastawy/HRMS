
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
};

type NavGroup = {
  title?: string;
  items: NavItem[];
}

const navConfig: (NavGroup | { separator: true })[] = [
  {
    items: [
      { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
      { href: '/employees', label: 'الموظفين', icon: Users },
    ],
  },
  { separator: true },
  {
    title: 'البيانات الرئيسية',
    items: [
      { href: '/departments', label: 'الأقسام', icon: Building },
      { href: '/locations', label: 'المواقع', icon: MapPin },
    ],
  },
  { separator: true },
  {
    title: 'العمليات اليومية',
    items: [
      { href: '/attendance', label: 'الحضور', icon: Clock },
      { href: '/leaves', label: 'الإجازات', icon: Calendar },
    ],
  },
  { separator: true },
  {
    title: 'الرواتب والأداء',
    items: [
      { href: '/payroll', label: 'الرواتب', icon: Wallet },
      { href: '/performance', label: 'الأداء', icon: Star },
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
      { href: '/audit-log', label: 'سجل التدقيق', icon: ShieldCheck },
      { href: '/settings', label: 'الإعدادات', icon: Settings },
    ]
  }
];


export function Nav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navConfig.map((group, index) => {
        if ('separator' in group) {
          return <SidebarMenuItem key={`sep-${index}`} className="!p-0"><SidebarSeparator className="my-2" /></SidebarMenuItem>;
        }
        
        return (
          <React.Fragment key={group.title || `group-${index}`}>
            {group.items.map(item => (
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
          </React.Fragment>
        )
      })}
    </SidebarMenu>
  );
}

    