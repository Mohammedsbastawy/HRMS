'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function OvertimeView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>طلبات العمل الإضافي</CardTitle>
                <CardDescription>إدارة سياسات ومراجعة طلبات العمل الإضافي. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض طلبات العمل الإضافي وإعدادات السياسات.
                </div>
            </CardContent>
        </Card>
    )
}
