
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Employee } from "@/lib/types";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const locationFormSchema = z.object({
  name_ar: z.string().min(2, { message: "الاسم بالعربية مطلوب." }),
  name_en: z.string().min(2, { message: "الاسم بالإنجليزية مطلوب." }),
  code: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
  manager_id: z.string().optional().or(z.literal('')),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export default function NewLocationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
       try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch('/api/employees?is_manager=true', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
             toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
             router.push('/login');
             return;
        }
        if (!response.ok) throw new Error('فشل في جلب المدراء');
        
        const data = await response.json();
        setEmployees(data.employees);
       } catch (error: any) {
         toast({ variant: 'destructive', title: 'فشل في جلب بيانات المدراء', description: error.message });
       }
    }
    fetchEmployees();
  }, [toast, router]);


  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name_ar: "",
      name_en: "",
      code: "",
      description: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      manager_id: "",
    }
  });

  async function onSubmit(data: LocationFormValues) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch('/api/locations', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw await response.json();
        }
        toast({
            title: "تم إنشاء الموقع بنجاح!",
            description: `تمت إضافة موقع "${data.name_ar}" إلى قاعدة البيانات.`,
        });
        router.push('/locations');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: error.message || "فشل في إنشاء الموقع. يرجى المحاولة مرة أخرى.",
        });
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة موقع جديد</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لإضافة فرع أو موقع جديد للشركة.
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
                    <FormLabel>اسم الموقع (بالعربية)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: المقر الرئيسي" {...field} />
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
                    <FormLabel>اسم الموقع (بالإنجليزية)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Head Office" {...field} />
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
                    <FormLabel>رمز الموقع (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="HQ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدير المسؤول (اختياري)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المدير المسؤول عن الموقع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.length > 0 ? (
                          employees.map(emp => (
                            <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="-" disabled>لا يوجد موظفين متاحين لإسنادهم كمدراء</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 شارع النيل، الجيزة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="القاهرة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدولة (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="مصر" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="+20123456789" {...field} />
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
                    <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="info@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أي تفاصيل إضافية عن الموقع."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/locations">إلغاء</Link>
              </Button>
              <Button type="submit">💾 حفظ الموقع</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
