
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams, useRouter } from 'next/navigation';
import type { Employee, Attendance } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface EmployeeHistory {
    employee: Employee;
    attendance: Attendance[];
}

export default function EmployeeAttendanceHistoryPage() {
    const [history, setHistory] = useState<EmployeeHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const employeeId = params.employeeId as string;

    useEffect(() => {
        async function fetchData() {
            if (!employeeId) return;
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }
                const headers = { Authorization: `Bearer ${token}` };

                const response = await fetch(`/api/attendance/history/${employeeId}`, { headers });
                
                if (!response.ok) throw new Error('فشل في جلب سجل الموظف');

                const data = await response.json();
                setHistory(data);

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [employeeId, router, toast]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Absent': return 'destructive';
            case 'Late': return 'secondary';
            case 'Present': return 'default';
            default: return 'outline';
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

    const calculateHours = (checkIn?: string | null, checkOut?: string | null) => {
        if (!checkIn || !checkOut) return '-';
        try {
            const start = new Date(`1970-01-01T${checkIn}Z`);
            const end = new Date(`1970-01-01T${checkOut}Z`);
            const diff = end.getTime() - start.getTime();
            if (diff < 0) return '0:00';
            
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            
            return `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (e) {
            return '-';
        }
    };

    const getDayOfWeek = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', { weekday: 'long' });
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (!history || !history.employee) {
        return <div>لم يتم العثور على بيانات الموظف.</div>
    }

    const { employee, attendance } = history;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={employee?.avatar} alt={employee?.full_name} />
                        <AvatarFallback>{employee?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{employee?.full_name}</CardTitle>
                        <CardDescription>
                            {employee?.jobTitle?.title_ar} في قسم {employee?.department?.name_ar}
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>سجل الحضور</CardTitle>
                    <CardDescription>عرض سجل الحضور والانصراف لآخر 30 يومًا.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>اليوم</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>وقت الدخول</TableHead>
                                <TableHead>وقت الخروج</TableHead>
                                <TableHead>ساعات العمل</TableHead>
                                <TableHead>ملاحظات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendance.length > 0 ? (
                                attendance.map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell>{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                                        <TableCell>{getDayOfWeek(record.date)}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(record.status)}>{getStatusText(record.status)}</Badge></TableCell>
                                        <TableCell>{record.check_in || '-'}</TableCell>
                                        <TableCell>{record.check_out || '-'}</TableCell>
                                        <TableCell>{calculateHours(record.check_in, record.check_out)}</TableCell>
                                        <TableCell>{record.notes || '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        لا توجد سجلات حضور لعرضها.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
