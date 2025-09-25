
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPayrolls() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/payrolls');
            if(!response.ok) {
                throw new Error('فشل في جلب بيانات الرواتب');
            }
            const data = await response.json();
            setPayrolls(data.payrolls);
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchPayrolls();
  }, [toast]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>معالجة الرواتب</CardTitle>
          <CardDescription>إنشاء وإدارة كشوف رواتب الموظفين الشهرية.</CardDescription>
        </div>
        <Button size="sm" className="gap-1">
          <Download className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إنشاء كشف رواتب يوليو</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموظف</TableHead>
              <TableHead className="text-right">الراتب الأساسي</TableHead>
              <TableHead className="text-right">المكافأة</TableHead>
              <TableHead className="text-right">الخصومات</TableHead>
              <TableHead className="text-right">صافي الراتب</TableHead>
              <TableHead className="text-right">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                </TableRow>
            ) : payrolls.length > 0 ? (
                payrolls.map((payroll) => {
                return (
                    <TableRow key={payroll.id}>
                    <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                    <TableCell>
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(payroll.base_salary)}
                    </TableCell>
                    <TableCell className="text-green-600">
                        +{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(payroll.overtime)}
                    </TableCell>
                    <TableCell className="text-destructive">
                        -{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(payroll.deductions)}
                    </TableCell>
                    <TableCell className="font-semibold">
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(payroll.net_salary)}
                    </TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm">عرض القسيمة</Button>
                    </TableCell>
                    </TableRow>
                );
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        لا توجد بيانات رواتب لعرضها.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    