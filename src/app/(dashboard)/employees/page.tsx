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
import { employees as initialEmployees } from '@/lib/data';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  const departments = [...new Set(initialEmployees.map(e => e.department))];
  const statuses = ['Active', 'On Leave', 'Terminated'];
  const statusTranslations: { [key: string]: string } = {
    Active: 'نشط',
    'On Leave': 'في إجازة',
    Terminated: 'معطل'
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (item: string) => {
    setter(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };
  
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(employee.status);
    const matchesDepartment = departmentFilter.length === 0 || departmentFilter.includes(employee.department);
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
              <TableHead className="text-right text-destructive">الرقم</TableHead>
              <TableHead className="text-right text-destructive">الاسم</TableHead>
              <TableHead className="text-right text-destructive">البريد الإلكتروني</TableHead>
              <TableHead className="text-right text-destructive">القسم</TableHead>
              <TableHead className="text-right text-destructive">الوظيفة</TableHead>
              <TableHead className="text-right text-destructive">تاريخ التعيين</TableHead>
              <TableHead className="text-right text-destructive">الحالة</TableHead>
              <TableHead className="text-destructive">
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={employee.avatar} alt={employee.name} />
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>{new Date(employee.hireDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                   <Badge 
                    variant={employee.status === 'Active' ? 'default' : employee.status === 'On Leave' ? 'secondary' : 'destructive'}
                    className={employee.status === 'Active' ? 'bg-green-500/20 text-green-700' : ''}
                   >
                    {statusTranslations[employee.status]}
                  </Badge>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
