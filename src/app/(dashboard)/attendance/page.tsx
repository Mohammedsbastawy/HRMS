
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Loader2, ServerCog, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Attendance } from '@/lib/types';


export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ message: string; errors: string[] } | null>(null);
  const { toast } = useToast();

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('فشل في جلب سجلات الحضور');
      const data = await response.json();
      setAttendance(data.attendance);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance/sync-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setSyncResult(result);

      if (response.ok || response.status === 207) { // 207 Multi-Status is a partial success
        toast({
          title: 'اكتملت المزامنة',
          description: result.message,
        });
        fetchAttendance(); // Refresh the table
      } else {
        throw new Error(result.message || 'فشل في المزامنة');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ أثناء المزامنة',
        description: error.message,
      });
      setSyncResult({ message: error.message, errors: [] });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Present': return 'default';
      case 'Late': return 'secondary';
      case 'Absent': return 'destructive';
      case 'On Leave': return 'outline';
      default: return 'outline';
    }
  };
  
  const getStatusText = (status: string) => {
     switch (status) {
      case 'Present': return 'حاضر';
      case 'Late': return 'متأخر';
      case 'Absent': return 'غائب';
      case 'On Leave': return 'إجازة';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>سجل الحضور والانصراف</CardTitle>
            <CardDescription>عرض سجلات الحضور اليومية للموظفين.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Upload className="h-3.5 w-3.5" />
              <span>استيراد ملف</span>
            </Button>
            <Button onClick={handleSyncAll} disabled={isSyncing} size="sm" className="gap-1">
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ServerCog className="h-3.5 w-3.5" />
              )}
              <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة من جميع الأجهزة'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncResult && (
            <Alert variant={syncResult.errors && syncResult.errors.length > 0 ? "destructive" : "default"} className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>نتائج المزامنة</AlertTitle>
              <AlertDescription>
                <p>{syncResult.message}</p>
                {syncResult.errors && syncResult.errors.length > 0 && (
                  <ul className="mt-2 list-disc list-inside">
                    {syncResult.errors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">وقت الحضور</TableHead>
                <TableHead className="text-right">وقت الانصراف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : attendance.length > 0 ? (
                attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3">
                        <div className="font-medium">{record.employeeName}</div>
                        <Avatar>
                          <AvatarImage src={record.employeeAvatar || undefined} />
                          <AvatarFallback>{record.employeeName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>{record.check_in}</TableCell>
                    <TableCell>{record.check_out}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(record.status)}>{getStatusText(record.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا توجد سجلات حضور لعرضها. ابدأ بمزامنة البيانات.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
