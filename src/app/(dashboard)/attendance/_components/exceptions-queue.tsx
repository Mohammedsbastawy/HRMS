'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ExceptionsQueue() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>قائمة الاستثناءات</CardTitle>
                <CardDescription>مراجعة ومعالجة استثناءات الحضور مثل نسيان البصمة. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض قائمة بالاستثناءات التي تحتاج إلى مراجعة.
                </div>
            </CardContent>
        </Card>
    )
}
