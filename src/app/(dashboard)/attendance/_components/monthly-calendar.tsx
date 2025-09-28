'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function MonthlyCalendar() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>التقويم الشهري</CardTitle>
                <CardDescription>عرض بيانات الحضور على شكل خريطة حرارية شهرية. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض التقويم الشهري والخريطة الحرارية.
                </div>
            </CardContent>
        </Card>
    )
}
