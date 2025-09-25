
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
import { departments } from "@/lib/data";

const jobTitleFormSchema = z.object({
  departmentId: z.string({ required_error: "يجب اختيار القسم." }),
  title: z.string().min(2, { message: "اسم المسمى الوظيفي مطلوب." }),
});

type JobTitleFormValues = z.infer<typeof jobTitleFormSchema>;

export default function NewJobTitlePage() {
  const { toast } = useToast();
  
  const form = useForm<JobTitleFormValues>({
    resolver: zodResolver(jobTitleFormSchema),
  });

  function onSubmit(data: JobTitleFormValues) {
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
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
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
