'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function DevicesImport() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>الأجهزة والاستيراد</CardTitle>
                <CardDescription>مراقبة حالة أجهزة البصمة واستيراد البيانات يدويًا. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض حالة الأجهزة وخيارات استيراد الملفات.
                </div>
            </CardContent>
        </Card>
    )
}
