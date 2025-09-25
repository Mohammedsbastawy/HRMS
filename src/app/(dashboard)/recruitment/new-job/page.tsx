
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const jobFormSchema = z.object({
  jobTitle: z.string().min(2, { message: "المسمى الوظيفي مطلوب." }),
  department: z.string({ required_error: "القسم مطلوب." }),
  description: z.string().min(10, { message: "الوصف يجب أن لا يقل عن 10 أحرف." }),
  status: z.enum(["Open", "Closed", "On-Hold"], {
    required_error: "الحالة مطلوبة.",
  }),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function NewJobPage() {
  const { toast } = useToast();
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      status: "Open",
    },
  });

  function onSubmit(data: JobFormValues) {
    // In a real app, you would post this data to your backend API.
    // For now, we'll just display it in a toast.
    toast({
      title: "تم إرسال نموذج الوظيفة!",
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
        <CardTitle>إضافة وظيفة جديدة</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لنشر وظيفة شاغرة جديدة في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="jobTitle"
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
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>القسم</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم المسؤول" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Engineering">الهندسة</SelectItem>
                      <SelectItem value="HR">الموارد البشرية</SelectItem>
                      <SelectItem value="Marketing">التسويق</SelectItem>
                      <SelectItem value="Sales">المبيعات</SelectItem>
                      <SelectItem value="Finance">المالية</SelectItem>
                    </SelectContent>
                  </Select>
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحالة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر حالة الوظيفة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">مفتوحة</SelectItem>
                      <SelectItem value="Closed">مغلقة</SelectItem>
                      <SelectItem value="On-Hold">معلقة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/recruitment">إلغاء</Link>
                </Button>
                <Button type="submit">💾 حفظ الوظيفة</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
