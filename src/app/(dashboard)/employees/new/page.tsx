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
  FormDescription,
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
import { departments, jobTitles, locations } from "@/lib/data";
import { useState } from "react";

const employeeFormSchema = z.object({
  fullName: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }),
  department: z.string({ required_error: "القسم مطلوب." }),
  jobTitle: z.string({ required_error: "المسمى الوظيفي مطلوب." }),
  location: z.string({ required_error: "الموقع مطلوب." }),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "تاريخ التعيين غير صالح."}),
  baseSalary: z.coerce.number().min(0, { message: "الراتب يجب أن يكون رقمًا موجبًا." }),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function NewEmployeePage() {
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: 0,
    },
  });

  const filteredJobTitles = selectedDepartment
    ? jobTitles.filter(jt => String(jt.department_id) === selectedDepartment)
    : [];

  function onSubmit(data: EmployeeFormValues) {
    toast({
      title: "تم إرسال النموذج بنجاح!",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة موظف جديد</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لإضافة موظف جديد إلى النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: أحمد علي" {...field} />
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
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="ahmed@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDepartment(value);
                        form.setValue('jobTitle', ''); // Reset job title
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر قسمًا" />
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
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartment}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المسمى الوظيفي" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredJobTitles.map(jt => (
                          <SelectItem key={jt.id} value={String(jt.id)}>{jt.title_ar}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموقع/الفرع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر موقع عمل الموظف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.length > 0 ? (
                            locations.map(loc => (
                              <SelectItem key={loc.id} value={String(loc.id)}>{loc.name_ar}</SelectItem>
                            ))
                          ) : (
                             <SelectItem value="-" disabled>لا توجد مواقع متاحة</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ التعيين</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الراتب الأساسي (سنويًا)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="90000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/employees">إلغاء</Link>
                </Button>
                <Button type="submit">إضافة موظف</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
