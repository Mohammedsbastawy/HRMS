
'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Briefcase, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams, useRouter } from 'next/navigation';
import type { Employee, LeaveRequest, Attendance } from '@/lib/types';

interface ProfileData {
  employee: Employee;
  leaves: LeaveRequest[];
  attendance: Attendance[];
  stats: {
    total_present: number;
    total_late: number;
    total_absent: number;
    annual_leave_balance: number;
  };
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function EmployeeProfilePage() {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id as string;

    useEffect(() => {
        if (!employeeId) return;

        async function fetchProfileData() {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }
                const response = await fetch(`/api/employees/${employeeId}/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('فشل في جلب بيانات ملف الموظف');
                }
                const data = await response.json();
                setProfileData(data);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: error.message,
                    details: error,
                    onClose: () => router.push('/employees') // Redirect on close
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfileData();
    }, [employeeId, router, toast]);

    const getLeaveStatusVariant = (status: string) => {
        const map: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
            'Approved': 'default',
            'HRApproved': 'default',
            'Pending': 'secondary',
            'PendingManager': 'secondary',
            'Rejected': 'destructive',
        };
        return map[status] || 'outline';
    };

    const getLeaveStatusText = (status: string) => {
        const map: { [key: string]: string } = {
            'Approved': 'موافق عليه',
            'HRApproved': 'موافق عليه',
            'Pending': 'قيد الانتظار',
            'PendingManager': 'قيد موافقة المدير',
            'Rejected': 'مرفوض',
        };
        return map[status] || status;
    }


    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    if (!profileData) {
        // This part will likely not be reached if the error handling redirects, but it's good for robustness.
        return null;
    }

    const { employee, leaves, attendance, stats } = profileData;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={employee.avatar} alt={employee.full_name} />
                        <AvatarFallback className="text-2xl">{employee.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <CardTitle className="text-2xl">{employee.full_name}</CardTitle>
                        <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> {employee.jobTitle?.title_ar || 'غير محدد'}</span>
                            <span className="flex items-center gap-1"><User className="h-4 w-4"/> {employee.department?.name_ar || 'غير محدد'}</span>
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="إجمالي الحضور" value={stats.total_present} icon={CheckCircle} />
                <StatCard title="إجمالي الغياب" value={stats.total_absent} icon={XCircle} />
                <StatCard title="إجمالي التأخير (مرة)" value={stats.total_late} icon={CalendarDays} />
                <StatCard title="رصيد الإجازات السنوية" value={`${stats.annual_leave_balance} يوم`} icon={CalendarDays} />
            </div>
            
            <Tabs defaultValue="leaves">
                <TabsList>
                    <TabsTrigger value="leaves">الإجازات والأذونات</TabsTrigger>
                    <TabsTrigger value="attendance">سجل الحضور</TabsTrigger>
                    <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
                </TabsList>
                <TabsContent value="leaves">
                    <Card>
                        <CardHeader><CardTitle>سجل الإجازات والأذونات</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>النوع</TableHead>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>المدة</TableHead>
                                        <TableHead>السبب/الملاحظات</TableHead>
                                        <TableHead>الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaves.length > 0 ? leaves.map(leave => (
                                        <TableRow key={leave.id}>
                                            <TableCell>{leave.leave_type}</TableCell>
                                            <TableCell>{new Date(leave.start_date).toLocaleDateString('ar-EG')} - {new Date(leave.end_date).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell>{leave.days_count ? `${leave.days_count} يوم` : (leave.hours_count ? `${leave.hours_count} ساعة` : '-')}</TableCell>
                                            <TableCell>{leave.reason || leave.notes || '-'}</TableCell>
                                            <TableCell><Badge variant={getLeaveStatusVariant(leave.status)}>{getLeaveStatusText(leave.status)}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">لا توجد إجازات مسجلة.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="attendance">
                     <Card>
                        <CardHeader><CardTitle>سجل الحضور والانصراف</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>وقت الحضور</TableHead>
                                        <TableHead>وقت الانصراف</TableHead>
                                        <TableHead>الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {attendance.length > 0 ? attendance.map(att => (
                                        <TableRow key={att.id}>
                                            <TableCell>{new Date(att.date).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell>{att.check_in || '-'}</TableCell>
                                            <TableCell>{att.check_out || '-'}</TableCell>
                                            <TableCell><Badge variant={att.status === 'Present' ? 'default' : 'secondary'}>{att.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">لا توجد سجلات حضور.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="info">
                    <Card>
                        <CardHeader><CardTitle>المعلومات الشخصية والوظيفية</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">البريد الإلكتروني</p>
                                    <p className="font-medium">{employee.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">رقم الهاتف</p>
                                    <p className="font-medium">{employee.phone || '-'}</p>
                                </div>
                                 <div className="space-y-1">
                                    <p className="text-muted-foreground">تاريخ التعيين</p>
                                    <p className="font-medium">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ar-EG') : '-'}</p>
                                </div>
                                 <div className="space-y-1">
                                    <p className="text-muted-foreground">المدير المباشر</p>
                                    <p className="font-medium">{employee.manager?.full_name || 'لا يوجد'}</p>
                                </div>
                                 <div className="space-y-1">
                                    <p className="text-muted-foreground">حالة الموظف</p>
                                    <p className="font-medium">{employee.status}</p>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
