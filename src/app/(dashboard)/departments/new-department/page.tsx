
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
import { useToast } from "@/components/ui/use-toast";

const departmentFormSchema = z.object({
  name_ar: z.string().min(2, { message: "الاسم بالعربية مطلوب." }),
  name_en: z.string().min(2, { message: "الاسم بالإنجليزية مطلوب." }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function NewDepartmentPage() {
  const { toast } = useToast();
  
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name_ar: "",
      name_en: "",
      description: "",
    }
  });

  async function onSubmit(data: DepartmentFormValues) {
    // TODO: Send data to the server to be saved in the database
    console.log(data);
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
    <Card className="max-w-2xl mx-auto">
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
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
