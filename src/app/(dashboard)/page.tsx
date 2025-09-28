
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Users,
  CalendarCheck,
  Star,
  Loader2,
  Briefcase,
} from 'lucide-react';
import type { Employee, LeaveRequest, PerformanceReview } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'فشل في جلب بيانات لوحة التحكم' }));
          throw errorData;
        }
        const data = await response.json();
        
        const averagePerformance = data.performanceReviews.length > 0 
          ? (data.performanceReviews.reduce((acc: number, r: PerformanceReview) => acc + r.score, 0) / data.performanceReviews.length).toFixed(1) 
          : "0";
        
        const openJobsCount = data.jobs?.length || 0;

        setStats([
          { title: 'إجمالي الموظفين', value: data.employees.length, icon: Users, change: `+${data.employees.filter((e: Employee) => e.hire_date && new Date(e.hire_date).getMonth() === new Date().getMonth()).length} هذا الشهر` },
          { title: 'طلبات الإجازة المعلقة', value: data.leaveRequests.filter((l: LeaveRequest) => l.status === 'Pending').length, icon: CalendarCheck, change: `${data.leaveRequests.filter((l: LeaveRequest) => l.status === 'Approved').length} موافق عليها` },
          { title: 'وظائف شاغرة', value: openJobsCount, icon: Briefcase },
          { title: 'متوسط تقييم الأداء', value: averagePerformance, icon: Star, change: 'مقارنة بالربع الماضي' },
        ]);

        setPendingLeaves(data.leaveRequests.filter((l: LeaveRequest) => l.status === 'Pending').slice(0, 5));
        setRecentActivities(data.recentActivities);

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: error.message,
          details: error
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الإجازة المعلقة</CardTitle>
              <CardDescription>
                لديك {pendingLeaves.length} طلبات إجازة معلقة تحتاج إلى مراجعة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-left">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeaves.length > 0 ? (
                    pendingLeaves.map(leave => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <span>{leave.employee?.full_name}</span>
                            <Avatar>
                              <AvatarImage src={leave.employee?.avatar || undefined} alt={leave.employee?.full_name || ''} />
                              <AvatarFallback>{leave.employee?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </div>
                        </TableCell>
                        <TableCell>{leave.leave_type}</TableCell>
                        <TableCell className="text-left">
                           <Button asChild size="sm" variant="outline">
                             <Link href="/leaves">مراجعة</Link>
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        لا توجد طلبات إجازة معلقة.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الأنشطة الأخيرة</CardTitle>
              <CardDescription>
                آخر التحديثات في نظام الموارد البشرية.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">{activity.text}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  لا توجد أنشطة حديثة لعرضها.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
