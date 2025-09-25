
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import db from '@/lib/db';
import type { AuditLog } from '@/lib/types';


export default function AuditLogPage() {
  const auditLogs: any[] = (() => {
    try {
      return db.prepare(`
        SELECT al.*, u.username 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ORDER BY al.timestamp DESC
      `).all();
    } catch(e) {
      console.error(e);
      return [];
    }
  })();

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
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-EG')}</TableCell>
                <TableCell className="font-medium">{log.username || 'نظام'}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
