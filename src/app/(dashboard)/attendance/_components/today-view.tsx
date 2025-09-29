
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Users, UserX, Clock, WifiOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface TodayData {
  kpis: {
    present: number;
    late: number;
    absent: number;
    offline_devices: number;
  };
  lists: {
    present: any[];
    late: any[];
    absent: any[];
    live_punches: any[];
    offline_devices: any[];
  };
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


export function TodayView() {
    const [data, setData] = useState<TodayData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
                    router.push('/login');
                    return;
                }
                const response = await fetch('/api/attendance/today-view', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('فشل في جلب البيانات');
                const result = await response.json();
                setData(result);
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "خطأ",
                    description: error.message
                });
                console.error("Failed to fetch today's view data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast, router]);

    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) {
        return <div className="text-center p-8">لم يتم العثور على بيانات لعرضها.</div>;
    }

    const { kpis, lists } = data;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="حاضر الآن" value={kpis.present} icon={Users}>
                     <EmployeeListDialog title="الموظفون الحاضرون" employees={lists.present} />
                </KpiCard>
                <KpiCard title="متأخر اليوم" value={kpis.late} icon={Clock}>
                     <EmployeeListDialog title="الموظفون المتأخرون" employees={lists.late} />
                </KpiCard>
                <KpiCard title="غائب اليوم" value={kpis.absent} icon={UserX}>
                     <EmployeeListDialog title="الموظفون الغائبون" employees={lists.absent} />
                </KpiCard>
                 <KpiCard title="أجهزة غير متزامنة" value={kpis.offline_devices} icon={WifiOff}>
                    <DeviceListDialog devices={lists.offline_devices} />
                 </KpiCard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>من المتواجد الآن؟</CardTitle>
                    <CardDescription>آخر تحديث منذ لحظات</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الموظف</TableHead>
                                <TableHead>الوردية</TableHead>
                                <TableHead>آخر بصمة</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الموقع</TableHead>
                                <TableHead>إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lists.live_punches.length > 0 ? lists.live_punches.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={item.employee?.avatar} />
                                                <AvatarFallback>{item.employee?.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {item.employee?.full_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.shift?.name || 'غير محدد'}</TableCell>
                                    <TableCell>{item.last_punch_time} ({item.last_punch_type})</TableCell>
                                    <TableCell><Badge variant={item.status === 'متأخر' ? 'secondary' : 'default'}>{item.status}</Badge></TableCell>
                                    <TableCell>{item.location || '-'}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">لا توجد سجلات بصمة حية لعرضها.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
