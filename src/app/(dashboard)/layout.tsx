
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { HrmsIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Nav } from '@/components/dashboard/nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HrmsIcon className="h-6 w-6 text-primary" />
              </Button>
              <span className="font-headline text-lg font-semibold">HRMS</span>
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Nav />
        </SidebarContent>
        <SidebarFooter>
          {/* Optional: Add footer content like settings or logout */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    