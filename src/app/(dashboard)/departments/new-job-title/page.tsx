
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
import { useToast } from "@/components/ui/use-toast";
import { departments } from "@/lib/data"; // Will be empty, that's expected

const jobTitleFormSchema = z.object({
  departmentId: z.string({ required_error: "يجب اختيار القسم." }),
  title_ar: z.string().min(2, { message: "المسمى بالعربية مطلوب." }),
  title_en: z.string().min(2, { message: "المسمى بالإنجليزية مطلوب." }),
});

type JobTitleFormValues = z.infer<typeof jobTitleFormSchema>;

export default function NewJobTitlePage() {
  const { toast } = useToast();
  
  const form = useForm<JobTitleFormValues>({
    resolver: zodResolver(jobTitleFormSchema),
  });

  async function onSubmit(data: JobTitleFormValues) {
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
              name="departmentId"
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
                <Button type="submit">💾 حفظ المسمى الوظيفي</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
