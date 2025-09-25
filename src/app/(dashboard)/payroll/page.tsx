
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
import { Download } from 'lucide-react';
import db from '@/lib/db';

export default function PayrollPage() {
  const payrolls: any[] = (() => {
    try {
      return db.prepare(`
        SELECT p.*, e.full_name as employeeName 
        FROM payrolls p 
        JOIN employees e ON p.employee_id = e.id
      `).all();
    } catch(e) {
      return [];
    }
  })();

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
            {payrolls.map((payroll) => {
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
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
