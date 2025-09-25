import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { attendance } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

export default function AttendancePage() {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>سجل الحضور اليومي</CardTitle>
            <CardDescription>عرض سجلات الحضور لليوم المحدد.</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={record.employeeAvatar} alt={record.employeeName} />
                          <AvatarFallback>{record.employeeName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{record.employeeName}</span>
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
                    <TableCell className="font-medium">{record.workedHours.toFixed(2)}</TableCell>
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
