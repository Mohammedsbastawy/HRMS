
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Fingerprint, Loader2 } from 'lucide-react';
import type { Attendance, Employee } from '@/lib/types';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

// The main component is now a client component
export function AttendancePageClient({ employees }: { employees: Employee[] }) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
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
    setAttendance([]);
    
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
      
      if (response.ok || (result.records && result.records.length > 0)) {
        toast({
          title: response.ok ? 'نجاح المزامنة' : 'عرض بيانات محاكاة',
          description: result.message || `تمت مزامنة ${result.records?.length || 0} سجل بنجاح.`,
          variant: response.ok ? 'default' : 'destructive'
        });
        
        // Process records
        const processed = processAttendanceRecords(result.records, employees);
        setAttendance(processed);

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
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length > 0 ? (
                  attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center justify-end gap-3">
                          <span>{record.employeeName}</span>
                          <Avatar>
                            <AvatarImage src={record.employeeAvatar || undefined} alt={record.employeeName} />
                            <AvatarFallback>{record.employeeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.check_in ? (
                          <Badge variant="secondary">{record.check_in}</Badge>
                        ) : (
                          <Badge variant="outline">غائب</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.check_out ? (
                          <Badge variant="secondary">{record.check_out}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-right">{record.status}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      لم يتم تسجيل أي حضور اليوم. اضغط على "مزامنة" لجلب البيانات.
                    </TableCell>
                  </TableRow>
                )}
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

// Helper function to process raw attendance logs
function processAttendanceRecords(records: any[], employees: Employee[]): Attendance[] {
    const attendanceMap = new Map<number, { check_in: string | null, check_out: string | null }>();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // First, initialize map for all employees
    employees.forEach(emp => {
        attendanceMap.set(emp.id, { check_in: null, check_out: null });
    });

    records.forEach(record => {
        const employeeId = parseInt(record.userId, 10);
        const recordDate = new Date(record.recordTime).toISOString().split('T')[0];

        // Process only today's records
        if (recordDate !== today) return;

        const recordTime = new Date(record.recordTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const existing = attendanceMap.get(employeeId) || { check_in: null, check_out: null };

        if (record.attState === 0) { // Check-in
            if (!existing.check_in || recordTime < existing.check_in) {
                existing.check_in = recordTime;
            }
        } else if (record.attState === 1) { // Check-out
            if (!existing.check_out || recordTime > existing.check_out) {
                existing.check_out = recordTime;
            }
        }
        attendanceMap.set(employeeId, existing);
    });
    
    const finalAttendance: Attendance[] = [];
    attendanceMap.forEach((times, employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            let status: 'Present' | 'Absent' | 'On Leave' | 'Late' = 'Absent';
            if(times.check_in) {
                status = 'Present';
                // Example of late logic: if check-in is after 9:30 AM
                const checkInDate = new Date(`${today}T${new Date(`1970-01-01 ${times.check_in}`).toTimeString().split(' ')[0]}`);
                const lateTime = new Date(`${today}T09:30:00`);
                if (checkInDate > lateTime) {
                    status = 'Late';
                }
            }

            finalAttendance.push({
                id: employeeId,
                employee_id: employeeId,
                date: today,
                employeeName: employee.full_name,
                employeeAvatar: employee.avatar,
                check_in: times.check_in,
                check_out: times.check_out,
                status: status,
            });
        }
    });

    return finalAttendance;
}
