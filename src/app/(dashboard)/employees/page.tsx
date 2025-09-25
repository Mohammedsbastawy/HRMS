
'use client';

import { useState } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, Eye, ListFilter } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

// This is a server component now, so we can't use useState directly at the top level.
// We'll pass the initial data as props.
const EmployeesPageWrapper = ({ initialEmployees }: { initialEmployees: Employee[] }) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  const departments = [...new Set(employees.map(e => e.department?.name_en).filter(Boolean))];
  const statuses = ['Active', 'Resigned', 'Terminated'];
  const statusTranslations: { [key: string]: string } = {
    Active: 'نشط',
    Resigned: 'مستقيل',
    Terminated: 'منتهى خدمته'
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (item: string) => {
    setter(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };
  
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter.length === 0 || (employee.status && statusFilter.includes(employee.status));
    const matchesDepartment = departmentFilter.length === 0 || (employee.department?.name_en && departmentFilter.includes(employee.department.name_en));
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>قائمة الموظفين</CardTitle>
                <CardDescription>إدارة الموظفين في مؤسستك.</CardDescription>
            </div>
            <Button asChild size="sm" className="gap-1">
              <Link href="/employees/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة موظف</span>
              </Link>
            </Button>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  className="w-full appearance-none bg-background pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">فلتر</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>الفلترة حسب القسم</DropdownMenuLabel>
                {departments.map(dept => (
                    <DropdownMenuCheckboxItem
                        key={dept}
                        checked={departmentFilter.includes(dept)}
                        onCheckedChange={() => handleFilterChange(setDepartmentFilter)(dept)}
                    >
                        {dept}
                    </DropdownMenuCheckboxItem>
                ))}
                 <DropdownMenuLabel>الفلترة حسب الحالة</DropdownMenuLabel>
                 {statuses.map(status => (
                    <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilter.includes(status)}
                        onCheckedChange={() => handleFilterChange(setStatusFilter)(status)}
                    >
                        {statusTranslations[status]}
                    </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الرقم</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">القسم</TableHead>
              <TableHead className="text-right">الوظيفة</TableHead>
              <TableHead className="text-right">تاريخ التعيين</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3">
                      <span>{employee.full_name}</span>
                      <Avatar>
                        <AvatarImage src={employee.avatar} alt={employee.full_name} />
                        <AvatarFallback>{employee.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department?.name_ar || 'N/A'}</TableCell>
                  <TableCell>{employee.jobTitle?.title_ar || 'N/A'}</TableCell>
                  <TableCell>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ar-EG') : 'N/A'}</TableCell>
                  <TableCell>
                    {employee.status && (
                      <Badge 
                        variant={employee.status === 'Active' ? 'default' : 'destructive'}
                        className={employee.status === 'Active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {statusTranslations[employee.status] || employee.status}
                      </Badge>
                    )}
                  </TableCell>
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
                        <DropdownMenuItem>
                          <Eye className="ml-2 h-4 w-4" />
                          عرض
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:!text-destructive">
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  لا يوجد موظفون حتى الآن.
                  <Button variant="link" asChild className="mt-2 block">
                    <Link href="/employees/new">ابدأ بإضافة موظف جديد</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import db from '@/lib/db';

export default function EmployeesDataPage() {
    const employeesData: any[] = (() => {
        try {
            const query = `
                SELECT 
                    e.id,
                    e.full_name,
                    e.email,
                    e.hire_date,
                    e.status,
                    e.avatar,
                    d.name_ar as department_name_ar,
                    d.name_en as department_name_en,
                    jt.title_ar as job_title_ar
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN job_titles jt ON e.job_title_id = jt.id
                ORDER BY e.created_at DESC
            `;
            const stmt = db.prepare(query);
            return stmt.all();
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            return [];
        }
    })();

    const formattedEmployees: Employee[] = employeesData.map(emp => ({
        id: emp.id,
        full_name: emp.full_name,
        email: emp.email,
        hire_date: emp.hire_date,
        status: emp.status,
        avatar: emp.avatar,
        department: {
            id: 0, // Placeholder
            name_ar: emp.department_name_ar,
            name_en: emp.department_name_en,
        },
        jobTitle: {
            id: 0, // Placeholder
            department_id: 0, // Placeholder
            title_ar: emp.job_title_ar,
            title_en: '' // Placeholder
        }
    }));


    return <EmployeesPageWrapper initialEmployees={formattedEmployees} />
}
