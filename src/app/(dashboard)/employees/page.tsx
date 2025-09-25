import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { employees } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function EmployeesPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>الموظفين</CardTitle>
          <CardDescription>إدارة الموظفين في مؤسستك.</CardDescription>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="#">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة موظف</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>المنصب</TableHead>
              <TableHead>الراتب السنوي</TableHead>
              <TableHead>تاريخ التعيين</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={employee.avatar} alt={employee.name} />
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{employee.name}</span>
                      <span className="text-sm text-muted-foreground">{employee.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={employee.status === 'Active' ? 'default' : employee.status === 'On Leave' ? 'secondary' : 'destructive'}>
                    {employee.status === 'Active' ? 'نشط' : employee.status === 'On Leave' ? 'في إجازة' : 'معطل'}
                  </Badge>
                </TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>${employee.salary.toLocaleString()}</TableCell>
                <TableCell>{new Date(employee.hireDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem>تعديل</DropdownMenuItem>
                      <DropdownMenuItem>عرض الملف الشخصي</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
