
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/employees', label: 'الموظفين', icon: Users },
  { href: '/departments', label: 'الأقسام', icon: Building },
  { href: '/attendance', label: 'الحاضرين', icon: Clock },
  { href: '/leaves', label: 'الإجازات', icon: Calendar },
  { href: '/payroll', label: 'الرواتب', icon: Wallet },
  { href: '/performance', label: 'الأداء', icon: Star },
  { href: '/recruitment', label: 'التوظيف', icon: Briefcase },
  { href: '/training', label: 'التدريب', icon: BookUser },
  { href: '/audit-log', label: 'سجل التدقيق', icon: ShieldCheck },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
