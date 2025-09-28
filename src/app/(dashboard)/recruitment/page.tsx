
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Eye, Edit, Trash2, Loader2, ListFilter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { Job, Department } from '@/lib/types';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/recruitment/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('فشل في جلب الوظائف');
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchDepartments = async () => {
      try {
          const res = await fetch('/api/departments');
          const data = await res.json();
          setDepartments(data.departments);
      } catch (error) {
          toast({ variant: 'destructive', title: 'فشل في جلب الأقسام' });
      }
  }

  useEffect(() => {
    fetchJobs();
    fetchDepartments();
  }, []);
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Open': return 'default';
      case 'On-Hold': return 'secondary';
      case 'Closed': return 'destructive';
      default: return 'outline';
    }
  };
  const getStatusText = (status: string) => {
    const map: { [key: string]: string } = { 'Open': 'مفتوحة', 'On-Hold': 'معلقة', 'Closed': 'مغلقة' };
    return map[status] || status;
  }

  const filteredJobs = jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || job.status === statusFilter;
      const matchesDept = !deptFilter || String(job.dept_id) === deptFilter;
      return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة التوظيف</CardTitle>
            <CardDescription>عرض وإدارة الوظائف الشاغرة والمتقدمين لها.</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/recruitment/new-job"><PlusCircle className="ml-2 h-4 w-4" /> إضافة وظيفة جديدة</Link>
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ابحث عن وظيفة..."
                  className="w-full bg-background pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
             {/* Filters can be added here later */}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المسمى الوظيفي</TableHead>
              <TableHead>القسم</TableHead>
              <TableHead>المتاح</TableHead>
              <TableHead>تم التوظيف</TableHead>
              <TableHead>المتقدمون</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.department?.name_ar || 'غير محدد'}</TableCell>
                  <TableCell>{job.openings}</TableCell>
                  <TableCell>{job.hires_count}</TableCell>
                  <TableCell>{job.applicants_count}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(job.status)}>{getStatusText(job.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="ml-2 h-4 w-4" /> عرض المتقدمين
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="ml-2 h-4 w-4" /> تعديل الوظيفة
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                           🌐 معاينة الصفحة العامة
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="ml-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  لا توجد وظائف شاغرة حاليًا.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
