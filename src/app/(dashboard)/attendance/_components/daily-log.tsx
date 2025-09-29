
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import type { Attendance } from '@/lib/types';

interface DailyLogRecord extends Attendance {
    employee_name?: string;
}

export function DailyLog() {
    const [logData, setLogData] = useState<DailyLogRecord[]>([]);
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
                const data = await response.json();
                setLogData(data.dailyLog || []);
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


    return (
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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : logData.length > 0 ? (
                            logData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.employee_name}</TableCell>
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
    )
}
