
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Department, JobTitle } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [deptsResponse, jobsResponse] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/job-titles')
        ]);
        
        if (!deptsResponse.ok || !jobsResponse.ok) {
          throw new Error('فشل في جلب البيانات');
        }
        const deptsData = await deptsResponse.json();
        const jobsData = await jobsResponse.json();
        
        setDepartments(deptsData.departments);
        setJobTitles(jobsData);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: error.message || 'حدث خطأ أثناء جلب البيانات.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>إدارة الأقسام</CardTitle>
            <CardDescription>عرض وتعديل أقسام الشركة.</CardDescription>
          </div>
          <Button asChild size="sm" className="gap-1">
            <Link href="/departments/new-department">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة قسم</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم القسم (العربية)</TableHead>
                <TableHead className="text-right">اسم القسم (الإنجليزية)</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">عدد الموظفين</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name_ar}</TableCell>
                    <TableCell>{dept.name_en}</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>{dept.headcount ?? 0}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا توجد أقسام حتى الآن.
                    <Button variant="link" asChild className="mt-2 block">
                      <Link href="/departments/new-department">ابدأ بإضافة قسم جديد</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>إدارة المسميات الوظيفية</CardTitle>
                <CardDescription>عرض وتعديل المسميات الوظيفية لكل قسم.</CardDescription>
            </div>
             <Button asChild size="sm" className="gap-1">
                <Link href="/departments/new-job-title">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة مسمى وظيفي</span>
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">المسمى الوظيفي (العربية)</TableHead>
                        <TableHead className="text-right">المسمى الوظيفي (الإنجليزية)</TableHead>
                        <TableHead className="text-right">القسم</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : jobTitles.length > 0 ? (
                    jobTitles.map(jt => {
                        return (
                            <TableRow key={jt.id}>
                                <TableCell className="font-medium">{jt.title_ar}</TableCell>
                                <TableCell>{jt.title_en}</TableCell>
                                <TableCell>{(jt as any).department_name_ar || 'غير محدد'}</TableCell>
                                <TableCell className="flex justify-end gap-2">
                                     <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        لا توجد مسميات وظيفية حتى الآن.
                        <Button variant="link" asChild className="mt-2 block">
                          <Link href="/departments/new-job-title">ابدأ بإضافة مسمى وظيفي جديد</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    