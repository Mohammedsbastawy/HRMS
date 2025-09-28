
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, Power, Loader2, Wifi, WifiOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Location, ZktDevice } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DeviceForm = ({ device, onSave, onCancel }: { device: Partial<ZktDevice> | null, onSave: () => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<ZktDevice>>({
    name: '',
    ip_address: '',
    location_id: undefined,
    ...device
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLocations() {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data.locations || []);
    }
    fetchLocations();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value === 'none' ? null : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id ? `/api/zkt-devices/${formData.id}` : '/api/zkt-devices';

    try {
        const token = localStorage.getItem('authToken');
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'فشل حفظ الجهاز');
      
      toast({ title: 'تم الحفظ بنجاح', description: `تم حفظ بيانات جهاز "${formData.name}".` });
      onSave();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">اسم الجهاز (للتمييز)</Label>
        <Input id="name" value={formData.name} onChange={handleChange} placeholder="جهاز الفرع الرئيسي" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ip_address">عنوان IP</Label>
        <Input id="ip_address" value={formData.ip_address} onChange={handleChange} placeholder="192.168.1.201" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location_id">ربط بموقع (اختياري)</Label>
        <Select
          onValueChange={(value) => handleSelectChange('location_id', value)}
          value={formData.location_id ? String(formData.location_id) : ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الموقع الذي يتواجد به الجهاز" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بلا موقع</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc.id} value={String(loc.id)}>{loc.name_ar}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
       <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'جاري الحفظ...' : 'حفظ الجهاز'}
        </Button>
      </DialogFooter>
    </form>
  );
};


export function ZktFingerprintSettings() {
  const [devices, setDevices] = useState<ZktDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Partial<ZktDevice> | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/zkt-devices', {
           headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'فشل في جلب الأجهزة');
      setDevices(data.devices);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAddClick = () => {
    setSelectedDevice({});
    setIsFormOpen(true);
  };
  
  const handleEditClick = (device: ZktDevice) => {
    setSelectedDevice(device);
    setIsFormOpen(true);
  };
  
  const handleDeleteClick = (device: ZktDevice) => {
    setSelectedDevice(device);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDevice?.id) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/zkt-devices/${selectedDevice.id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('فشل حذف الجهاز');
      toast({ title: 'تم الحذف', description: `تم حذف جهاز "${selectedDevice.name}".` });
      fetchDevices();
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsDeleteAlertOpen(false);
      setSelectedDevice(null);
    }
  };

  const handleTestConnection = async (device: ZktDevice) => {
    setTestingDeviceId(device.id);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ip: device.ip_address, port: 4370 }), // Port is hardcoded for now as per new schema
      });

      const result = await response.json();
      
      toast({
        title: result.success ? 'نجاح الاتصال' : 'فشل الاتصال',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

    } catch (error: any) {
       toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ غير متوقع أثناء اختبار الاتصال.' });
    } finally {
        setTestingDeviceId(null);
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>إدارة أجهزة البصمة (ZKTeco)</CardTitle>
            <CardDescription>إضافة وتعديل أجهزة الحضور والانصراف المرتبطة بالفروع.</CardDescription>
          </div>
           <Button size="sm" className="gap-1" onClick={handleAddClick}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة جهاز</span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الجهاز</TableHead>
                <TableHead className="text-right">عنوان IP</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : devices.length > 0 ? (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{device.ip_address}</TableCell>
                    <TableCell>{device.location_name || 'غير محدد'}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => handleTestConnection(device)} disabled={testingDeviceId === device.id}>
                          {testingDeviceId === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleEditClick(device)}>
                          <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(device)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">لا توجد أجهزة محفوظة. ابدأ بإضافة جهاز جديد.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDevice?.id ? 'تعديل جهاز بصمة' : 'إضافة جهاز بصمة جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات الاتصال بالجهاز وقم بربطه بأحد المواقع.</DialogDescription>
          </DialogHeader>
          <DeviceForm 
            device={selectedDevice}
            onCancel={() => setIsFormOpen(false)}
            onSave={() => {
              setIsFormOpen(false);
              fetchDevices();
            }}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الجهاز "{selectedDevice?.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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

    