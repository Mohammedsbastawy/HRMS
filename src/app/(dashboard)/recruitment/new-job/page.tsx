
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@/lib/types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const jobFormSchema = z.object({
  title: z.string().min(1, "المسمى الوظيفي مطلوب."),
  department_id: z.string().min(1, "القسم مطلوب."),
  description: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function NewJobPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const deptsRes = await fetch('/api/departments', { headers });
            
            if (!deptsRes.ok) throw new Error('فشل تحميل بيانات الأقسام');

            const deptsData = await deptsRes.json();
            setDepartments(deptsData.departments || []);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);


  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      department_id: "",
      description: "",
    },
  });

  async function onSubmit(data: JobFormValues) {
     try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/recruitment/jobs', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({...data, status: 'Open'}),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'فشل في إنشاء الوظيفة');
        }
        
        toast({
            title: "تم إنشاء الوظيفة بنجاح!",
        });
        router.push('/recruitment');

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: error.message,
        });
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة وظيفة جديدة</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لنشر وظيفة شاغرة جديدة في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mr-2">جاري تحميل بيانات النموذج...</p>
            </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>القسم</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم المسؤول" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map(dept => (
                          <SelectItem key={dept.id} value={String(dept.id)}>{dept.name_ar}</SelectItem>
                        ))
                      ) : (
                         <SelectItem value="loading" disabled>لا توجد أقسام متاحة</SelectItem>
                      )}
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
                  <FormControl>
                    <Input placeholder="مثال: مهندس برمجيات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف الوظيفي</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="صف المهام الرئيسية، المسؤوليات، والمؤهلات المطلوبة للوظيفة."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/recruitment">إلغاء</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'جاري الحفظ...' : '💾 حفظ الوظيفة'}
                </Button>
            </div>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
