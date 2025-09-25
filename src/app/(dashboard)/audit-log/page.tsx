import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auditLogs } from '@/lib/data';

export default function AuditLogPage() {
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
              <TableHead>الوقت</TableHead>
              <TableHead>المستخدم</TableHead>
              <TableHead>الإجراء</TableHead>
              <TableHead>التفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell className="font-medium">{log.user}</TableCell>
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
