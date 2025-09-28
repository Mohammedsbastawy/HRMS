'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function CorrectionsView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>طلبات التصحيح</CardTitle>
                <CardDescription>مراجعة طلبات الموظفين لتصحيح أوقات الحضور والانصراف. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض قائمة بطلبات تصحيح الحضور للموافقة أو الرفض.
                </div>
            </CardContent>
        </Card>
    )
}
