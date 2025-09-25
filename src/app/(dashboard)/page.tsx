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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Users,
  CalendarCheck,
  Briefcase,
  Star,
} from 'lucide-react';
import { employees, leaveRequests, applicants, performanceReviews } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const stats = [
  { title: 'إجمالي الموظفين', value: employees.length, icon: Users, change: '+2 هذا الشهر' },
  { title: 'طلبات الإجازة المعلقة', value: leaveRequests.filter(l => l.status === 'Pending').length, icon: CalendarCheck, change: '3 موافق عليها' },
  { title: 'وظائف شاغرة', value: applicants.filter(a => a.stage !== 'Hired' && a.stage !== 'Rejected').length, icon: Briefcase, change: '+1 جديدة' },
  { title: 'متوسط ​​تقييم الأداء', value: (performanceReviews.reduce((acc, r) => acc + r.score, 0) / performanceReviews.length).toFixed(1), icon: Star, change: '+0.1 عن الربع الماضي' },
];

export default function DashboardPage() {
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').slice(0, 5);
  const recentActivities = [
    { text: 'تمت الموافقة على إجازة فاطمة محمد', time: 'منذ 5 دقائق' },
    { text: 'تمت إضافة مرشح جديد "خالد الغامدي"', time: 'منذ ساعتين' },
    { text: 'تم إنشاء كشف رواتب شهر يوليو', time: 'منذ يوم واحد' },
  ];

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
                <p className="text-xs text-muted-foreground">{stat.change}</p>
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
                    <TableHead>الموظف</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead className="text-left">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeaves.map(leave => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={leave.employeeAvatar} alt={leave.employeeName} />
                            <AvatarFallback>{leave.employeeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{leave.employeeName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{leave.leaveType}</TableCell>
                      <TableCell className="text-left">
                         <Button asChild size="sm" variant="outline">
                           <Link href="/leaves">مراجعة</Link>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{activity.text}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
