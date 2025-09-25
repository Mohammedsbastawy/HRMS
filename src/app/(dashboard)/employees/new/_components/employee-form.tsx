
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import type { Department, JobTitle, Location } from "@/lib/types";

const employeeFormSchema = z.object({
  full_name: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }),
  department_id: z.string({ required_error: "القسم مطلوب." }),
  job_title_id: z.string({ required_error: "المسمى الوظيفي مطلوب." }),
  location_id: z.string({ required_error: "الموقع مطلوب." }),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "تاريخ التعيين غير صالح."}),
  base_salary: z.coerce.number().min(0, { message: "الراتب يجب أن يكون رقمًا موجبًا." }),
  manager_id: z.string().optional(),
  status: z.enum(['Active', 'Resigned', 'Terminated']),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
    departments: Department[];
    jobTitles: JobTitle[];
    locations: Location[];
    managers: { id: number, full_name: string }[];
}

export function EmployeeForm({ departments, jobTitles, locations, managers }: EmployeeFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      hire_date: new Date().toISOString().split('T')[0],
      base_salary: 0,
      status: 'Active',
    },
  });

  const filteredJobTitles = selectedDepartment
    ? jobTitles.filter(jt => String(jt.department_id) === selectedDepartment)
    : [];

  async function onSubmit(data: EmployeeFormValues) {
    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل في إضافة الموظف');
        }

        toast({
            title: "تمت إضافة الموظف بنجاح!",
            description: `تم حفظ بيانات ${data.full_name} في النظام.`,
        });
        router.push('/employees');
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: error.message || "فشل في إضافة الموظف. يرجى المحاولة مرة أخرى.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="full_name"
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
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>القسم</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedDepartment(value);
                    form.setValue('job_title_id', ''); // Reset job title
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
            name="job_title_id"
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
                     {selectedDepartment && filteredJobTitles.length === 0 && (
                        <SelectItem value="-" disabled>لا توجد مسميات وظيفية لهذا القسم</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
              control={form.control}
              name="location_id"
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
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المدير المباشر (اختياري)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدير المباشر" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="">بلا مدير</SelectItem>
                      {managers.map(manager => (
                          <SelectItem key={manager.id} value={String(manager.id)}>{manager.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
           <FormField
            control={form.control}
            name="hire_date"
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
            name="base_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الراتب الأساسي (شهريًا)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="9000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>حالة الموظف</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر حالة الموظف" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Active">نشط</SelectItem>
                            <SelectItem value="Resigned">مستقيل</SelectItem>
                            <SelectItem value="Terminated">منتهى خدمته</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/employees">إلغاء</Link>
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "جاري الحفظ..." : "إضافة موظف"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
