'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Users, UserX, Clock, WifiOff } from 'lucide-react';

const kpiData = [
    { title: "حاضر الآن", value: "87", icon: Users },
    { title: "متأخر اليوم", value: "5", icon: Clock },
    { title: "غائب اليوم", value: "12", icon: UserX },
    { title: "أجهزة غير متزامنة", value: "1", icon: WifiOff, variant: "destructive" as "destructive" },
];

const liveData = [
    { name: "علي حسن", shift: "صباحي", lastPunch: "08:05 ص (دخول)", status: "متأخر", location: "المقر الرئيسي" },
    { name: "فاطمة الزهراء", shift: "صباحي", lastPunch: "07:58 ص (دخول)", status: "حاضر", location: "المقر الرئيسي" },
    { name: "محمد عبدالله", shift: "مسائي", lastPunch: "لم تبدأ بعد", status: "لم تبدأ", location: "فرع جدة" },
    { name: "سارة إبراهيم", shift: "صباحي", lastPunch: "09:15 ص (دخول)", status: "إجازة", location: "المقر الرئيسي" },
];

export function TodayView() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiData.map(kpi => (
                     <Card key={kpi.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className={`h-4 w-4 ${kpi.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>من المتواجد الآن؟</CardTitle>
                    <CardDescription>آخر تحديث منذ 30 ثانية</CardDescription>
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
                            {liveData.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.shift}</TableCell>
                                    <TableCell>{item.lastPunch}</TableCell>
                                    <TableCell><Badge variant={item.status === 'متأخر' ? 'secondary' : 'default'}>{item.status}</Badge></TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
