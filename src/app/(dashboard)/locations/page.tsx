
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Location, Employee } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

const LocationForm = ({ location, onSave, onCancel, employees }: { location: Partial<Location>, onSave: () => void, onCancel: () => void, employees: Employee[] }) => {
    const [formData, setFormData] = useState<Partial<Location>>(location);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        setFormData(location);
    }, [location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value === 'none' ? null : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const method = formData.id ? 'PUT' : 'POST';
        const url = formData.id ? `/api/locations/${formData.id}` : '/api/locations';
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/login');
                return;
            }
            const response = await fetch(url, {
                method,
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'فشل حفظ الموقع');
            
            toast({ title: 'تم الحفظ بنجاح', description: `تم حفظ بيانات موقع "${formData.name_ar}".` });
            onSave();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name_ar">اسم الموقع (بالعربية)</Label>
                    <Input id="name_ar" value={formData.name_ar || ''} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name_en">اسم الموقع (بالإنجليزية)</Label>
                    <Input id="name_en" value={formData.name_en || ''} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="code">رمز الموقع (اختياري)</Label>
                    <Input id="code" value={formData.code || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="manager_id">المدير المسؤول (اختياري)</Label>
                    <Select onValueChange={(value) => handleSelectChange('manager_id', value)} value={formData.manager_id ? String(formData.manager_id) : 'none'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">بلا مدير</SelectItem>
                            {employees.map(emp => <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/login');
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            const [locationsRes, employeesRes] = await Promise.all([
                fetch('/api/locations', { headers }),
                fetch('/api/employees?is_manager=true', { headers })
            ]);

            if (locationsRes.status === 401 || employeesRes.status === 401) {
                toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
                router.push('/login');
                return;
            }
            
            if (!locationsRes.ok) throw new Error('فشل في جلب المواقع');
            if (!employeesRes.ok) throw new Error('فشل في جلب المدراء');

            const locationsData = await locationsRes.json();
            const employeesData = await employeesRes.json();
            setLocations(locationsData.locations || []);
            setEmployees(employeesData.employees || []);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [router, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditClick = (location: Location) => {
        setSelectedLocation(location);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (location: Location) => {
        setSelectedLocation(location);
        setIsDeleteAlertOpen(true);
    };
    
    const handleFormSave = () => {
        setIsEditModalOpen(false);
        fetchData();
    }

    const confirmDelete = async () => {
        if (!selectedLocation) return;
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/login');
                return;
            }
            const response = await fetch(`/api/locations/${selectedLocation.id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('فشل حذف الموقع');
            toast({ title: 'تم الحذف بنجاح' });
            fetchData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsDeleteAlertOpen(false);
        }
    };

    const filteredLocations = locations.filter(loc => 
        (loc.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.name_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.city && loc.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <>
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>إدارة مواقع الشركة</CardTitle>
              <CardDescription>عرض وتعديل فروع ومواقع الشركة.</CardDescription>
            </div>
              <div className="flex items-center gap-2">
                   <div className="relative">
                       <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input
                          type="search"
                          placeholder="بحث عن موقع..."
                          className="w-full appearance-none bg-background pr-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                       />
                  </div>
                  <Button asChild size="sm" className="gap-1">
                      <Link href="/locations/new">
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة موقع</span>
                      </Link>
                  </Button>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الرمز</TableHead>
                  <TableHead className="text-right">اسم الموقع (العربية)</TableHead>
                  <TableHead className="text-right">اسم الموقع (الإنجليزية)</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">المدير المسؤول</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                      <TableRow key={loc.id}>
                      <TableCell className="text-right">{loc.code || '-'}</TableCell>
                      <TableCell className="font-medium text-right">{loc.name_ar}</TableCell>
                      <TableCell className="text-right">{loc.name_en}</TableCell>
                      <TableCell className="text-right">{loc.city || '-'}</TableCell>
                      <TableCell className="text-right">{loc.manager?.full_name || 'غير محدد'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(loc)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(loc)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                      </TableRow>
                  ))
                ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          لا توجد مواقع مسجلة حتى الآن.
                          <Button variant="link" asChild className="mt-2 block">
                             <Link href="/locations/new">ابدأ بإضافة موقع جديد</Link>
                          </Button>
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>تعديل الموقع</DialogTitle>
            <DialogDescription>تحديث بيانات الموقع المحدد.</DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <LocationForm 
                location={selectedLocation} 
                onSave={handleFormSave}
                onCancel={() => setIsEditModalOpen(false)}
                employees={employees}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الموقع "{selectedLocation?.name_ar}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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
