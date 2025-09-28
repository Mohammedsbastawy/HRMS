
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import type { Department, JobTitle, Location, Employee } from "@/lib/types";

const employeeFormSchema = z.object({
  zk_uid: z.string().min(1, { message: "ID الموظف مطلوب." }),
  full_name: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }),
  department_id: z.coerce.string({ required_error: "القسم مطلوب." }),
  job_title_id: z.coerce.string({ required_error: "المسمى الوظيفي مطلوب." }),
  location_id: z.coerce.string({ required_error: "الموقع مطلوب." }),
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
    employee?: Employee; // Make employee optional for new vs edit
}

export function EmployeeForm({ departments, jobTitles, locations, managers, employee }: EmployeeFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const defaultValues: Partial<EmployeeFormValues> = employee ? {
      ...employee,
      department_id: String(employee.department_id),
      job_title_id: String(employee.job_title_id),
      location_id: String(employee.location_id),
      manager_id: employee.manager_id ? String(employee.manager_id) : 'none',
      hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
  } : {
      zk_uid: "",
      full_name: "",
      email: "",
      hire_date: new Date().toISOString().split('T')[0],
      base_salary: 0,
      status: 'Active',
      manager_id: 'none',
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(employee ? String(employee.department_id) : null);

  // When defaultValues are populated from the employee prop, useEffect can sync the form state.
  useEffect(() => {
    if (employee) {
      form.reset(defaultValues);
      setSelectedDepartment(String(employee.department_id));
    }
  }, [employee, form, defaultValues]);


  const filteredJobTitles = selectedDepartment
    ? jobTitles.filter(jt => String(jt.department_id) === selectedDepartment)
    : [];

  async function onSubmit(data: EmployeeFormValues) {
    const isEditing = !!employee;
    const url = isEditing ? `/api/employees/${employee.id}` : '/api/employees';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw errorData;
        }

        toast({
            title: isEditing ? "تم تحديث بيانات الموظف!" : "تمت إضافة الموظف بنجاح!",
            description: `تم حفظ بيانات ${data.full_name} في النظام.`,
        });
        router.push('/employees');
        router.refresh();
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: error.message || (isEditing ? "فشل في تحديث الموظف." : "فشل في إضافة الموظف."),
            details: error
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="zk_uid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID الموظف (للبصمة)</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: 101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  value={field.value}
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدير المباشر" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="none">بلا مدير</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                {form.formState.isSubmitting ? "جاري الحفظ..." : employee ? "حفظ التعديلات" : "إضافة موظف"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
