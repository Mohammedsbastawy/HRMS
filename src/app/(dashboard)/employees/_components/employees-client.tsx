
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, Eye, ListFilter, Loader2, FileText } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function EmployeesTable({ employees, isLoading, emptyStateMessage }: { employees: Employee[], isLoading: boolean, emptyStateMessage: string }) {
  const router = useRouter();

  const statusTranslations: { [key: string]: string } = {
    Active: 'نشط',
    Resigned: 'مستقيل',
    Terminated: 'منتهى خدمته',
    PendingOnboarding: 'بانتظار التأهيل'
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'PendingOnboarding': return 'secondary';
      case 'Resigned':
      case 'Terminated':
        return 'destructive';
      default: return 'outline';
    }
  }

  return (
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">ID الموظف</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">القسم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  <p>جاري تحميل البيانات...</p>
                </TableCell>
              </TableRow>
            ) : employees.length > 0 ? (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium text-right">{employee.id}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span>{employee.full_name}</span>
                      <Avatar>
                        <AvatarImage src={employee.avatar || undefined} alt={employee.full_name} />
                        <AvatarFallback>{employee.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{employee.email}</TableCell>
                  <TableCell className="text-right">{employee.department?.name_ar || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {employee.status && (
                      <Badge 
                        variant={getStatusVariant(employee.status)}
                        className={employee.status === 'Active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {statusTranslations[employee.status] || employee.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => router.push(`/employees/${employee.id}`)}>
                          <Eye className="ml-2 h-4 w-4" />
                          عرض الملف الشخصي
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => router.push(`/documents/${employee.id}`)}>
                          <FileText className="ml-2 h-4 w-4" />
                          عرض المستندات
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/employees/${employee.id}/edit`)}>
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
  )
}


export function EmployeesPageClient() {
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [newJoiners, setNewJoiners] = useState<Employee[]>([]);
  const [terminatedEmployees, setTerminatedEmployees] = useState<Employee[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'active';

  const fetchEmployeesByStatus = useCallback(async (status: 'Active' | 'PendingOnboarding' | 'Terminated' | 'Resigned', setter: React.Dispatch<React.SetStateAction<Employee[]>>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
        return;
      }
      const response = await fetch(`/api/employees?status=${status}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
        return;
      }
      if (!response.ok) {
        throw new Error(`فشل في جلب الموظفين (${status})`);
      }
      const data = await response.json();
      setter(data.employees || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    fetchEmployeesByStatus('Active', setActiveEmployees);
    fetchEmployeesByStatus('PendingOnboarding', setNewJoiners);
    // Combine terminated and resigned for the archive view
    Promise.all([
        fetch('/api/employees?status=Terminated', { headers: { 'Authorization': `${localStorage.getItem('authToken')}` } }).then(res => res.json()),
        fetch('/api/employees?status=Resigned', { headers: { 'Authorization': `${localStorage.getItem('authToken')}` } }).then(res => res.json())
    ]).then(([terminatedData, resignedData]) => {
        const combined = [...(terminatedData.employees || []), ...(resignedData.employees || [])];
        setTerminatedEmployees(combined);
    });
  }, [fetchEmployeesByStatus]);
  
  const filterAndSearch = (employees: Employee[]) => {
      return employees.filter(employee => 
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
  }

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
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} onValueChange={(tab) => router.push(`/employees?tab=${tab}`)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">الموظفون النشطون</TabsTrigger>
            <TabsTrigger value="new_joiners">المنضمون الجدد</TabsTrigger>
            <TabsTrigger value="terminated">الأرشيف</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
              <EmployeesTable employees={filterAndSearch(activeEmployees)} isLoading={isLoading} emptyStateMessage="لا يوجد موظفون نشطون لعرضهم." />
          </TabsContent>
           <TabsContent value="new_joiners">
              <EmployeesTable employees={filterAndSearch(newJoiners)} isLoading={isLoading} emptyStateMessage="لا يوجد موظفون جدد في قائمة الانتظار." />
          </TabsContent>
           <TabsContent value="terminated">
              <EmployeesTable employees={filterAndSearch(terminatedEmployees)} isLoading={isLoading} emptyStateMessage="لا يوجد موظفون في الأرشيف." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
