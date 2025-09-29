
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, Users, UserX, Clock, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import type { Attendance } from '@/lib/types';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DailyLogData {
    kpis: {
      present: number;
      late: number;
      absent: number;
      offline_devices: number;
    };
    dailyLog: (Attendance & { employee_name?: string })[];
    modalLists: {
        present: any[];
        late: any[];
        absent: any[];
        offline_devices: any[];
    }
}

const KpiCard = ({ title, value, icon: Icon, children }: { title: string, value: number, icon: React.ElementType, children: React.ReactNode }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className={`h-4 w-4 ${value > 0 && title.includes('أجهزة') ? 'text-destructive' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                </CardContent>
            </Card>
        </DialogTrigger>
        {children}
    </Dialog>
);

const EmployeeListDialog = ({ title, employees }: { title: string, employees: any[] }) => (
    <DialogContent className="max-w-md">
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>قائمة بالموظفين الذين ينطبق عليهم هذا الحالة لليوم.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>القسم</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.length > 0 ? employees.map(emp => (
                        <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell>{emp.department?.name_ar || '-'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow><TableCell colSpan={2} className="h-24 text-center">لا يوجد موظفين لعرضهم.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </DialogContent>
);

const DeviceListDialog = ({ devices }: { devices: any[] }) => (
     <DialogContent className="max-w-md">
        <DialogHeader>
            <DialogTitle>الأجهزة غير المتزامنة</DialogTitle>
            <DialogDescription>قائمة بالأجهزة التي فشل الاتصال بها أو مزامنتها.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الجهاز</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>الحالة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.length > 0 ? devices.map(dev => (
                        <TableRow key={dev.id}>
                            <TableCell className="font-medium">{dev.name}</TableCell>
                            <TableCell dir="ltr" className="text-right">{dev.ip_address}</TableCell>
                            <TableCell><Badge variant="destructive">{dev.status}</Badge></TableCell>
                        </TableRow>
                    )) : (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center">لا توجد أجهزة غير متصلة حاليًا.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </DialogContent>
)


export function DailyLog() {
    const [data, setData] = useState<DailyLogData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchDailyLog() {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }
                const response = await fetch('/api/attendance/daily-log', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('فشل في جلب السجل اليومي');
                }
                const responseData = await response.json();
                setData(responseData);
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "خطأ",
                    description: error.message
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchDailyLog();
    }, [router, toast]);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Absent':
                return 'destructive';
            case 'Late':
                return 'secondary';
            case 'Present':
                return 'default';
            default:
                return 'outline';
        }
    };
    
     const getStatusText = (status: string) => {
        const translations: { [key: string]: string } = {
            'Present': 'حاضر',
            'Absent': 'غائب',
            'Late': 'متأخر',
            'On Leave': 'إجازة'
        };
        return translations[status] || status;
    };

    const calculateHours = (checkIn: string | null | undefined, checkOut: string | null | undefined) => {
        if (!checkIn || !checkOut) return '0:00';
        try {
            const start = new Date(`1970-01-01T${checkIn}Z`);
            const end = new Date(`1970-01-01T${checkOut}Z`);
            const diff = end.getTime() - start.getTime();
            if (diff < 0) return '0:00';
            
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            
            return `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}`;

        } catch (e) {
            return '0:00';
        }
    };

    if (isLoading) {
        return (
          <div className="flex items-center justify-center h-full p-8">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        );
    }
    
    if (!data) {
        return <div className="text-center p-8">لم يتم العثور على بيانات لعرضها.</div>;
    }

    const { kpis, dailyLog, modalLists } = data;

    return (
        <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="حاضر الآن" value={kpis.present} icon={Users}>
                     <EmployeeListDialog title="الموظفون الحاضرون" employees={modalLists.present} />
                </KpiCard>
                <KpiCard title="متأخر اليوم" value={kpis.late} icon={Clock}>
                     <EmployeeListDialog title="الموظفون المتأخرون" employees={modalLists.late} />
                </KpiCard>
                <KpiCard title="غائب اليوم" value={kpis.absent} icon={UserX}>
                     <EmployeeListDialog title="الموظفون الغائبون" employees={modalLists.absent} />
                </KpiCard>
                 <KpiCard title="أجهزة غير متزامنة" value={kpis.offline_devices} icon={WifiOff}>
                    <DeviceListDialog devices={modalLists.offline_devices} />
                 </KpiCard>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>السجل اليومي المفصل</CardTitle>
                    <CardDescription>عرض تفصيلي لحضور الموظفين لليوم المحدد.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>دخول</TableHead>
                                <TableHead>خروج</TableHead>
                                <TableHead>ساعات العمل</TableHead>
                                <TableHead>تأخير (د)</TableHead>
                                <TableHead>خروج مبكر (د)</TableHead>
                                <TableHead>إضافي (د)</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>المصدر</TableHead>
                                <TableHead>إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyLog.length > 0 ? (
                                dailyLog.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/attendance/history/${item.employee_id}`} className="hover:underline">
                                                {item.employee_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{item.check_in || '-'}</TableCell>
                                        <TableCell>{item.check_out || '-'}</TableCell>
                                        <TableCell>{calculateHours(item.check_in, item.check_out)}</TableCell>
                                        <TableCell>{item.late_minutes || '-'}</TableCell>
                                        <TableCell>{item.early_leave_minutes || '-'}</TableCell>
                                        <TableCell>{item.overtime_minutes || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(item.status)}>{getStatusText(item.status)}</Badge>
                                        </TableCell>
                                        <TableCell>{item.source}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        لا توجد بيانات حضور لليوم.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
