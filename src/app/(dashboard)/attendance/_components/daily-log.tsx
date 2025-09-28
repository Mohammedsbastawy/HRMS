'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from 'lucide-react';

const dailyLogData = [
    { name: "علي حسن", shift: "صباحي (08:00 - 16:00)", checkIn: "08:05", checkOut: "16:01", hours: "7:56", late: 5, earlyLeave: 0, ot: 0, status: "متأخر", source: "ZKTeco-HQ" },
    { name: "فاطمة الزهراء", shift: "صباحي (08:00 - 16:00)", checkIn: "07:58", checkOut: "16:05", hours: "8:07", late: 0, earlyLeave: 0, ot: 5, status: "حاضر", source: "ZKTeco-HQ" },
    { name: "خالد الغامدي", shift: "صباحي (08:00 - 16:00)", checkIn: null, checkOut: null, hours: "0:00", late: 0, earlyLeave: 0, ot: 0, status: "غائب", source: "-" },
];

export function DailyLog() {
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
                            <TableHead>الوردية</TableHead>
                            <TableHead>دخول</TableHead>
                            <TableHead>خروج</TableHead>
                            <TableHead>ساعات</TableHead>
                            <TableHead>تأخير (د)</TableHead>
                            <TableHead>خروج مبكر (د)</TableHead>
                            <TableHead>إضافي (د)</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>المصدر</TableHead>
                            <TableHead>إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dailyLogData.map(item => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.shift}</TableCell>
                                <TableCell>{item.checkIn}</TableCell>
                                <TableCell>{item.checkOut}</TableCell>
                                <TableCell>{item.hours}</TableCell>
                                <TableCell>{item.late > 0 ? item.late : '-'}</TableCell>
                                <TableCell>{item.earlyLeave > 0 ? item.earlyLeave : '-'}</TableCell>
                                <TableCell>{item.ot > 0 ? item.ot : '-'}</TableCell>
                                <TableCell><Badge variant={item.status === 'غائب' ? 'destructive' : 'default'}>{item.status}</Badge></TableCell>
                                <TableCell>{item.source}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
