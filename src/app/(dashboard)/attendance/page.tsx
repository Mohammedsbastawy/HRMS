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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { attendance as initialAttendance } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Fingerprint, Loader2 } from 'lucide-react';
import type { Attendance } from '@/lib/types';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { toast } = useToast();
  const [zktConfig, setZktConfig] = useState<{ ip?: string; user?: string; pass?: string }>({});

  useEffect(() => {
    // Load config from localStorage on the client
    const savedConfig = localStorage.getItem('zktConfig');
    if (savedConfig) {
      setZktConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    
    if (!zktConfig.ip) {
      setSyncError('لم يتم تعيين عنوان IP للجهاز. يرجى الانتقال إلى صفحة الإعدادات وتكوينه أولاً.');
      setIsSyncing(false);
      return;
    }

    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zktConfig),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'نجاح المزامنة',
          description: result.message || `تمت مزامنة ${result.records?.length || 0} سجل بنجاح.`,
        });
        // In a real app, you would process result.records and update state
        console.log('Synced Records:', result.records);
      } else {
        throw new Error(result.message || 'فشل في بدء المزامنة');
      }
    } catch (error: any) {
      setSyncError(error.message);
      toast({
        variant: 'destructive',
        title: 'خطأ في المزامنة',
        description: 'لم نتمكن من الاتصال بجهاز البصمة. يرجى التحقق من الإعدادات والمحاولة مرة أخرى.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>سجل الحضور اليومي</CardTitle>
              <CardDescription>عرض سجلات الحضور لليوم المحدد.</CardDescription>
            </div>
            <Button onClick={handleSync} disabled={isSyncing} size="sm" className="gap-1">
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Fingerprint className="h-3.5 w-3.5" />
              )}
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {isSyncing ? 'جاري المزامنة...' : 'مزامنة من الجهاز'}
              </span>
            </Button>
          </CardHeader>
          <CardContent>
            {syncError && (
                 <Alert variant="destructive" className="mb-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>فشل الاتصال!</AlertTitle>
                    <AlertDescription>
                        <p>{syncError}</p>
                        <Button variant="link" className="p-0 h-auto" asChild>
                            <Link href="/settings">اذهب إلى الإعدادات للتحقق من عنوان IP.</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">تسجيل الدخول</TableHead>
                  <TableHead className="text-right">تسجيل الخروج</TableHead>
                  <TableHead className="text-right">ساعات العمل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3">
                        <span>{record.employeeName}</span>
                        <Avatar>
                          <AvatarImage src={record.employeeAvatar} alt={record.employeeName} />
                          <AvatarFallback>{record.employeeName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkIn ? (
                        <Badge variant="secondary">{record.checkIn}</Badge>
                      ) : (
                        <Badge variant="outline">غائب</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkOut ? (
                        <Badge variant="secondary">{record.checkOut}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-right">{record.workedHours.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>اختر تاريخًا</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
