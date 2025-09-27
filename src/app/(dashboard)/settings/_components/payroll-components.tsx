
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
import type { PayrollComponent } from '@/lib/types';
import { ComponentFormDialog } from './component-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function PayrollComponents() {
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<PayrollComponent | null>(null);

  const fetchComponents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payroll-components');
      if (!response.ok) throw new Error('فشل في جلب مكونات الرواتب');
      const data = await response.json();
      setComponents(data.components || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, [toast]);
  
  const handleAddClick = () => {
    setSelectedComponent(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = (component: PayrollComponent) => {
    setSelectedComponent(component);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (component: PayrollComponent) => {
    setSelectedComponent(component);
    setIsDeleteAlertOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchComponents();
  };

  const confirmDelete = async () => {
    if (!selectedComponent) return;
    try {
      const response = await fetch(`/api/payroll-components/${selectedComponent.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('فشل حذف المكون');
      toast({ title: 'تم الحذف بنجاح' });
      fetchComponents();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const translations = {
    earning: 'إيراد',
    deduction: 'استقطاع',
    benefit: 'ميزة',
    insurance: 'تأمين',
    fixed: 'مبلغ ثابت',
    percent: 'نسبة مئوية',
    slab: 'شريحة',
    formula: 'صيغة',
    base: 'أساسي',
    gross: 'إجمالي',
    custom: 'مخصص',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>مكتبة مكونات الرواتب</CardTitle>
              <CardDescription>
                إدارة بنود الإيرادات والاستقطاعات التي تشكل كشف الراتب.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddClick}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة مكون
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرمز</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>طريقة الحساب</TableHead>
                <TableHead>خاضع للضريبة</TableHead>
                <TableHead>قبل الضريبة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : components.length > 0 ? (
                components.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{translations[c.component_type] || c.component_type}</TableCell>
                    <TableCell>{translations[c.calculation_type] || c.calculation_type}</TableCell>
                    <TableCell>{c.taxable ? 'نعم' : 'لا'}</TableCell>
                    <TableCell>{c.pre_tax ? 'نعم' : 'لا'}</TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'default' : 'secondary'}>
                        {c.active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(c)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(c)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    لا توجد مكونات رواتب. ابدأ بإضافة مكون جديد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ComponentFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        component={selectedComponent}
      />

       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المكون "{selectedComponent?.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
