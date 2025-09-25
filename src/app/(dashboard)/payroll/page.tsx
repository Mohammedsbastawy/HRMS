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
import { MoreHorizontal, Download } from 'lucide-react';
import { payrolls, employees } from '@/lib/data';
import Link from 'next/link';

export default function PayrollPage() {
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
              const employee = employees.find(e => e.id === payroll.employeeId);
              return (
                <TableRow key={payroll.id}>
                  <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                  <TableCell>${payroll.baseSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">+${payroll.bonus.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">-${payroll.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">${payroll.netSalary.toLocaleString()}</TableCell>
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
