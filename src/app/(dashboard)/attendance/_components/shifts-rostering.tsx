'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ShiftsRostering() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>الورديات والجداول</CardTitle>
                <CardDescription>إدارة الورديات (صباحي، مسائي، ليلي...) وتعيينها للموظفين. (قيد التطوير)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center text-muted-foreground p-8">
                    سيتم هنا عرض أدوات إدارة الورديات وتوزيعها على الموظفين.
                </div>
            </CardContent>
        </Card>
    )
}
