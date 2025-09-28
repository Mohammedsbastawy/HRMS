
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { TaxScheme } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const taxBracketSchema = z.object({
    min_amount: z.coerce.number().min(0),
    max_amount: z.coerce.number().nullable(),
    rate: z.coerce.number().min(0).max(100),
});

const taxSchemeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  method: z.enum(['slab', 'flat']),
  active: z.boolean().default(true),
  brackets: z.array(taxBracketSchema).optional(),
});

type TaxSchemeFormValues = z.infer<typeof taxSchemeSchema>;

function TaxSchemeForm({ scheme, onSuccess, onCancel }: { scheme: Partial<TaxScheme> | null, onSuccess: () => void, onCancel: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<TaxSchemeFormValues>({
        resolver: zodResolver(taxSchemeSchema),
        defaultValues: scheme || { name: '', method: 'slab', active: true, brackets: [{ min_amount: 0, max_amount: null, rate: 0 }] },
    });
    
    const { fields, append, remove } = useFieldArray({ control, name: "brackets" });

    const method = watch('method');

    const onSubmit = async (data: TaxSchemeFormValues) => {
        // Validation for overlapping brackets can be added here
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/login');
                return;
            }
            const url = scheme?.id ? `/api/tax-schemes/${scheme.id}` : '/api/tax-schemes';
            const httpMethod = scheme?.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: httpMethod,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error(scheme?.id ? 'فشل تحديث المخطط' : 'فشل إنشاء المخطط');

            toast({ title: 'تم الحفظ بنجاح' });
            onSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        }
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                    <Label htmlFor="name">اسم المخطط الضريبي</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>طريقة الحساب</Label>
                         <Controller
                            name="method"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slab">شرائح</SelectItem>
                                    <SelectItem value="flat">نسبة ثابتة</SelectItem>
                                </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                     <div className="space-y-2 pt-8 flex items-center">
                        <Controller name="active" control={control} render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />} />
                        <Label htmlFor="active" className="mr-2">نشط</Label>
                    </div>
                </div>

                {method === 'slab' && (
                    <div className="space-y-4">
                        <div>
                          <Label>شرائح الضريبة</Label>
                          <p className="text-sm text-muted-foreground">
                            عرف نطاق الدخل السنوي للموظف ونسبة الضريبة لكل نطاق.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1/3">من مبلغ (الدخل السنوي)</div>
                            <div className="w-1/3">إلى مبلغ (الدخل السنوي)</div>
                            <div className="w-1/4">النسبة %</div>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Input type="number" placeholder="مثال: 0" {...register(`brackets.${index}.min_amount`)} className="w-1/3"/>
                                <Input type="number" placeholder="مثال: 30000" {...register(`brackets.${index}.max_amount`)} className="w-1/3"/>
                                <Input type="number" placeholder="مثال: 10" {...register(`brackets.${index}.rate`)} className="w-1/4"/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ min_amount: 0, max_amount: null, rate: 0 })}>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            إضافة شريحة
                        </Button>
                    </div>
                )}
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ
                </Button>
            </DialogFooter>
        </form>
    )
}

export function TaxRules() {
  const [schemes, setSchemes] = useState<TaxScheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<TaxScheme | null>(null);

  const fetchSchemes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/tax-schemes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('فشل في جلب مخططات الضريبة');
      const data = await response.json();
      setSchemes(data.schemes || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleAddClick = () => {
    setSelectedScheme(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = async (scheme: TaxScheme) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        router.push('/login');
        return;
    }
    const response = await fetch(`/api/tax-schemes/${scheme.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const fullScheme = await response.json();
    setSelectedScheme(fullScheme);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchSchemes();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قواعد ومخططات الضريبة</CardTitle>
              <CardDescription>
                إدارة كيفية حساب ضريبة الدخل على رواتب الموظفين.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddClick}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة مخطط ضريبي
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>طريقة الحساب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : schemes.length > 0 ? (
                schemes.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.method === 'slab' ? 'شرائح' : 'نسبة ثابتة'}</TableCell>
                    <TableCell>
                      <Badge variant={s.active ? 'default' : 'secondary'}>
                        {s.active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    لا توجد مخططات ضريبية. ابدأ بإضافة مخطط جديد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedScheme ? 'تعديل مخطط ضريبي' : 'إضافة مخطط ضريبي جديد'}</DialogTitle>
          </DialogHeader>
          <TaxSchemeForm 
            scheme={selectedScheme}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
