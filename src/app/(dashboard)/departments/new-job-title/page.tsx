
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Department } from '@/lib/types';
import { useEffect, useState } from "react";

const jobTitleFormSchema = z.object({
  department_id: z.string({ required_error: "يجب اختيار القسم." }),
  title_ar: z.string().min(2, { message: "المسمى بالعربية مطلوب." }),
  title_en: z.string().min(2, { message: "المسمى بالإنجليزية مطلوب." }),
});

type JobTitleFormValues = z.infer<typeof jobTitleFormSchema>;

export default function NewJobTitlePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        setDepartments(data.departments);
      } catch (error) {
        toast({ variant: 'destructive', title: 'فشل في جلب الأقسام' });
      }
    }
    fetchDepartments();
  }, [toast]);

  const form = useForm<JobTitleFormValues>({
    resolver: zodResolver(jobTitleFormSchema),
  });

  async function onSubmit(data: JobTitleFormValues) {
    try {
      const response = await fetch('/api/job-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء المسمى الوظيفي');
      }

      toast({
        title: "تم إنشاء المسمى الوظيفي بنجاح!",
        description: `تمت إضافة "${data.title_ar}".`,
      });
      router.push('/departments');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ!",
        description: "فشل في إنشاء المسمى الوظيفي.",
      });
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة مسمى وظيفي جديد</CardTitle>
        <CardDescription>
          أضف مسمى وظيفيًا جديدًا واربطه بالقسم الصحيح.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>القسم</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم الذي يتبعه المسمى الوظيفي" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map(dept => (
                          <SelectItem key={dept.id} value={String(dept.id)}>{dept.name_ar}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="-" disabled>لا توجد أقسام متاحة</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="title_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي (بالعربية)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مهندس برمجيات" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي (بالإنجليزية)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/departments">إلغاء</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'جاري الحفظ...' : '💾 حفظ المسمى الوظيفي'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
