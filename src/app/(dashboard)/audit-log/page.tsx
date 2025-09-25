
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAuditLogs() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/audit-log');
        if (!response.ok) {
          throw new Error('فشل في جلب سجل التدقيق');
        }
        const data = await response.json();
        setAuditLogs(data.auditLogs);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuditLogs();
  }, [toast]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التدقيق</CardTitle>
        <CardDescription>سجل لجميع الإجراءات المتخذة داخل النظام.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الوقت</TableHead>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">الإجراء</TableHead>
              <TableHead className="text-right">التفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                </TableRow>
            ) : auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-EG')}</TableCell>
                    <TableCell className="font-medium">{log.username || 'نظام'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.details}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        لا توجد سجلات تدقيق لعرضها.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    