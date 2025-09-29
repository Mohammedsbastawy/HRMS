
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from 'next/navigation';
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const departmentFormSchema = z.object({
  name_ar: z.string().min(2, { message: "الاسم بالعربية مطلوب." }),
  name_en: z.string().min(2, { message: "الاسم بالإنجليزية مطلوب." }),
  code: z.string().optional(),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function NewDepartmentPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name_ar: "",
      name_en: "",
      code: "",
      email: "",
      budget: 0,
      description: "",
    }
  });

  async function onSubmit(data: DepartmentFormValues) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
        return;
      }

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
        return;
      }

      if (!response.ok) {
        throw await response.json();
      }

      toast({
        title: "تم إنشاء القسم بنجاح!",
        description: `تمت إضافة قسم "${data.name_ar}" إلى قاعدة البيانات.`,
      });
      router.push('/departments');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل في إنشاء القسم",
        description: error.message || "يرجى المحاولة مرة أخرى.",
        details: error
      });
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة قسم جديد</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لإضافة قسم جديد إلى الشركة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم القسم (بالعربية)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: تقنية المعلومات" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم القسم (بالإنجليزية)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Information Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز القسم (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="IT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني للقسم (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="it.dept@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الميزانية السنوية (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="صف بإيجاز مسؤوليات القسم."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/departments">إلغاء</Link>
                </Button>
                <Button type="submit">💾 حفظ القسم</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
