'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import type { LeaveRequest } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { approveLeaveRequest, rejectLeaveRequest } from '@/lib/actions';
import { useToast } from '@/components/ui/use-toast';


const LeaveRequestClientPage = ({ leaveRequests }: { leaveRequests: LeaveRequest[] }) => {
  const { toast } = useToast();

  const handleApprove = async (id: number) => {
    const result = await approveLeaveRequest(id);
    toast({
      title: result.success ? 'تمت الموافقة' : 'خطأ',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleReject = async (id: number) => {
    // For simplicity, we'll use a prompt. A modal would be better for a real app.
    const notes = prompt('يرجى إدخال سبب الرفض:');
    if (notes !== null) { // prompt returns null if cancelled
      const result = await rejectLeaveRequest(id, notes);
      toast({
        title: result.success ? 'تم الرفض' : 'خطأ',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    }
  };

  const getStatusVariant = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
    }
  };
  
  const getStatusText = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return 'موافق عليه';
      case 'Pending':
        return 'قيد الانتظار';
      case 'Rejected':
        return 'مرفوض';
    }
  };

  const getLeaveTypeText = (leaveType: 'Annual' | 'Sick' | 'Maternity' | 'Unpaid') => {
    switch (leaveType) {
      case 'Annual':
        return 'سنوية';
      case 'Sick':
        return 'مرضية';
      case 'Unpaid':
        return 'غير مدفوعة';
      case 'Maternity':
        return 'أمومة';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>إدارة الإجازات</CardTitle>
          <CardDescription>مراجعة وإدارة طلبات إجازات الموظفين.</CardDescription>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="#">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">طلب إجازة</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموظف</TableHead>
              <TableHead className="text-right">نوع الإجازة</TableHead>
              <TableHead className="text-right">التواريخ</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3 justify-end">
                      <div className='text-right'>
                        <div className="font-medium">{request.employee.full_name}</div>
                        <div className="text-sm text-muted-foreground">{request.employee_id}</div>
                      </div>
                      <Avatar>
                        <AvatarImage src={request.employee.avatar || undefined} alt={request.employee.full_name} />
                        <AvatarFallback>{request.employee.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell>{getLeaveTypeText(request.leave_type)}</TableCell>
                  <TableCell>{`${new Date(request.start_date).toLocaleDateString('ar-EG')} - ${new Date(request.end_date).toLocaleDateString('ar-EG')}`}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusVariant(request.status)}
                      className={
                          request.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' 
                        : request.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200'
                        : ''
                      }
                    >
                      {getStatusText(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => handleApprove(request.id)}
                          disabled={request.status !== 'Pending'}
                        >
                          <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          موافقة
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleReject(request.id)}
                          disabled={request.status !== 'Pending'} 
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="ml-2 h-4 w-4" />
                          رفض
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  لا توجد طلبات إجازة حاليًا.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import db from '@/lib/db';
import type { Employee } from '@/lib/types';

// This is the main Server Component page
export default function LeavesPage() {
    
    const leaveRequestsData: any[] = db.prepare(`
        SELECT * FROM leave_requests ORDER BY created_at DESC
    `).all();

    const employeeIds = [...new Set(leaveRequestsData.map(lr => lr.employee_id))];
    let employees: Employee[] = [];
    if (employeeIds.length > 0) {
        const placeholders = employeeIds.map(() => '?').join(',');
        employees = db.prepare(`SELECT id, full_name, avatar FROM employees WHERE id IN (${placeholders})`).all(employeeIds) as Employee[];
    }
    
    const employeesMap = new Map(employees.map(e => [e.id, e]));

    const formattedLeaveRequests: LeaveRequest[] = leaveRequestsData.map(lr => ({
        ...lr,
        start_date: lr.start_date,
        end_date: lr.end_date,
        employee: employeesMap.get(lr.employee_id) || { id: lr.employee_id, full_name: 'موظف غير معروف', email: '' }
    })) as LeaveRequest[];

    return <LeaveRequestClientPage leaveRequests={formattedLeaveRequests} />;
}
