
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { Department, JobTitle, Location } from '@/lib/types';

const jobFormSchema = z.object({
  title: z.string().min(1, { message: 'المسمى الوظيفي مطلوب.' }),
  dept_id: z.string().min(1, { message: 'القسم مطلوب.' }),
  description: z.string().optional(),
  location: z.string().min(1, { message: 'الموقع مطلوب.' }),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'intern', 'temporary'], {
    required_error: 'نوع التوظيف مطلوب.',
  }),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'manager', 'director']).optional(),
  openings: z.coerce
    .number({ invalid_type_error: 'يجب أن يكون رقمًا' })
    .int('يجب أن يكون رقمًا صحيحًا')
    .min(1, 'يجب أن يكون هناك شاغر واحد على الأقل')
    .default(1),
  status: z.enum(['Open', 'On-Hold', 'Closed']).default('Open'),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function NewJobPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      dept_id: '',
      description: '',
      location: '',
      employment_type: 'full-time',
      openings: 1,
      status: 'Open',
    },
  });

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        const [deptsRes, jobsRes, locsRes] = await Promise.all([
          fetch('/api/departments', { headers }),
          fetch('/api/job-titles', { headers }),
          fetch('/api/locations', { headers }),
        ]);
        if (!deptsRes.ok || !jobsRes.ok || !locsRes.ok) throw new Error('فشل في جلب البيانات');

        const deptsData = await deptsRes.json();
        const jobsData = await jobsRes.json();
        const locsData = await locsRes.json();

        setDepartments(deptsData.departments);
        setJobTitles(jobsData);
        setLocations(locsData.locations);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'خطأ في تحميل البيانات',
          description: error.message,
          details: error,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  const onSubmit = async (data: JobFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw responseData;
      }

      toast({ title: 'تم إنشاء الوظيفة بنجاح' });
      router.push('/recruitment');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل في إنشاء الوظيفة',
        description: error.message || 'يرجى مراجعة البيانات المدخلة والمحاولة مرة أخرى.',
        details: error,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>إضافة وظيفة شاغرة جديدة</CardTitle>
        <CardDescription>املأ تفاصيل الوظيفة لنشرها داخليًا.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dept_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المسمى الوظيفي" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobTitles.map((jt) => (
                          <SelectItem key={jt.id} value={jt.title_ar}>
                            {jt.title_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف الوظيفي</FormLabel>
                  <FormControl>
                    <Textarea placeholder="صف المهام والمسؤوليات والمتطلبات..." rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموقع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موقع العمل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.name_ar}>
                            {loc.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع التوظيف</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">دوام كامل</SelectItem>
                        <SelectItem value="part-time">دوام جزئي</SelectItem>
                        <SelectItem value="contract">عقد</SelectItem>
                        <SelectItem value="intern">تدريب</SelectItem>
                        <SelectItem value="temporary">مؤقت</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="openings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الشواغر</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/recruitment">إلغاء</Link>
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ الوظيفة
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
