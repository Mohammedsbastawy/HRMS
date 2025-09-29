
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
import { Loader2, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import type { DocumentType } from '@/lib/types';
import { DocumentTypeFormDialog } from './document-type-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export function DocumentSettings() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  const fetchDocTypes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/documents/types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('فشل في جلب أنواع المستندات');
      const data = await response.json();
      setDocTypes(data.document_types || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleToggle = async (id: number, field: 'active' | 'default_required' | 'requires_expiry', value: boolean) => {
    const originalDocTypes = [...docTypes];
    // Optimistic UI update
    setDocTypes(prev => prev.map(dt => dt.id === id ? { ...dt, [field]: value } : dt));

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('فشل تحديث الإعداد');
      toast({ title: 'تم تحديث الإعداد بنجاح' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
      setDocTypes(originalDocTypes); // Revert on error
    }
  };
  
  const handleAddClick = () => {
    setSelectedDocType(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setIsDeleteAlertOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchDocTypes();
  };

  const confirmDelete = async () => {
    if (!selectedDocType) return;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/documents/types/${selectedDocType.id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('فشل حذف نوع المستند');
      toast({ title: 'تم الحذف بنجاح' });
      fetchDocTypes();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>أنواع المستندات</CardTitle>
              <CardDescription>
                إدارة أنواع المستندات التي يمكن للموظفين رفعها في النظام.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddClick}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة نوع
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>يتطلب تاريخ انتهاء</TableHead>
                <TableHead>مطلوب بشكل افتراضي</TableHead>
                <TableHead>نشط</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : docTypes.length > 0 ? (
                docTypes.map(dt => (
                  <TableRow key={dt.id}>
                    <TableCell className="font-medium">{dt.title_ar}</TableCell>
                    <TableCell>
                      <Badge variant={dt.category === 'basic' ? 'destructive' : 'secondary'}>
                        {dt.category === 'basic' ? 'أساسي' : 'إضافي'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Switch
                        checked={dt.requires_expiry}
                        onCheckedChange={(value) => handleToggle(dt.id, 'requires_expiry', value)}
                        aria-label="Toggle requires expiry"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={dt.default_required}
                        onCheckedChange={(value) => handleToggle(dt.id, 'default_required', value)}
                        aria-label="Toggle default required"
                      />
                    </TableCell>
                    <TableCell>
                       <Switch
                        checked={dt.active}
                        onCheckedChange={(value) => handleToggle(dt.id, 'active', value)}
                        aria-label="Toggle active"
                      />
                    </TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(dt)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(dt)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    لا توجد أنواع مستندات. ابدأ بإضافة نوع جديد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <DocumentTypeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        docType={selectedDocType}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف نوع المستند "{selectedDocType?.title_ar}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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
