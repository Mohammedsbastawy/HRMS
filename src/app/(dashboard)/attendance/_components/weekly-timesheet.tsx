'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function WeeklyTimesheet() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>الجدول الزمني الأسبوعي</CardTitle>
                <CardDescription>عرض بيانات الحضور على شكل شبكة أسبوعية. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض الجدول الزمني الأسبوعي (Gantt style).
                </div>
            </CardContent>
        </Card>
    )
}
