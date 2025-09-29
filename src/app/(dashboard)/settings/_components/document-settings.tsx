
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
import { Loader2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

interface DocumentType {
  id: number;
  code: string;
  title_ar: string;
  title_en: string;
  category: string;
  default_required: boolean;
  requires_expiry: boolean;
  active: boolean;
}

export function DocumentSettings() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

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

  const handleToggle = async (id: number, field: 'active' | 'default_required', value: boolean) => {
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
            {/* <Button size="sm" onClick={() => {}}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة نوع
            </Button> */}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : docTypes.length > 0 ? (
                docTypes.map(dt => (
                  <TableRow key={dt.id}>
                    <TableCell className="font-medium">{dt.title_ar}</TableCell>
                    <TableCell>
                      <Badge variant={dt.category === 'basic' ? 'default' : 'secondary'}>
                        {dt.category === 'basic' ? 'أساسي' : 'إضافي'}
                      </Badge>
                    </TableCell>
                    <TableCell>{dt.requires_expiry ? 'نعم' : 'لا'}</TableCell>
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا توجد أنواع مستندات. سيتم إضافتها من قاعدة البيانات.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
