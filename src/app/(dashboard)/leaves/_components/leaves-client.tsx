
'use client';

import { useState, useEffect, startTransition, useCallback } from 'react';
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
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { LeaveRequest } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { RequestLeaveDialog } from './request-leave-dialog';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  username: string;
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
}

export function LeaveRequestClientPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchLeaveRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
        return;
      }
      const res = await fetch('/api/leaves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      const data = await res.json();
      setLeaveRequests(data.leaveRequests);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleAction = async (id: number, action: 'approve' | 'reject', notes?: string) => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
            return;
        }
        const response = await fetch(`/api/leaves/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action, notes }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'فشل في تحديث الطلب');
        }

        toast({
            title: result.success ? (action === 'approve' ? 'تمت الموافقة' : 'تم الرفض') : 'خطأ',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
        
        startTransition(() => {
            fetchLeaveRequests();
        });

    } catch (error: any) {
        toast({
            title: 'حدث خطأ',
            description: error.message,
            variant: 'destructive',
        });
    }
  };


  const handleApprove = (id: number) => {
    handleAction(id, 'approve');
  };

  const handleReject = (id: number) => {
    const notes = prompt('يرجى إدخال سبب الرفض:');
    if (notes !== null) {
      handleAction(id, 'reject', notes);
    }
  };

  const getStatusVariant = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
    }
  };
  
  const getStatusText = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved': return 'موافق عليه';
      case 'Pending': return 'قيد الانتظار';
      case 'Rejected': return 'مرفوض';
    }
  };

  const getLeaveTypeText = (leaveType: string) => {
    const types: { [key: string]: string } = {
      'Annual': 'سنوية', 'Sick': 'مرضية', 'Unpaid': 'غير مدفوعة', 'Maternity': 'أمومة'
    };
    return types[leaveType] || leaveType;
  };
  
  const canManage = user?.role !== 'Employee';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{canManage ? 'إدارة الإجازات' : 'إجازاتي'}</CardTitle>
            <CardDescription>
              {canManage ? 'مراجعة وإدارة طلبات إجازات الموظفين.' : 'عرض وتقديم طلبات الإجازة الخاصة بك.'}
            </CardDescription>
          </div>
          {!canManage && (
            <Button size="sm" className="gap-1" onClick={() => setIsRequestDialogOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span>طلب إجازة</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canManage && <TableHead className="text-right">الموظف</TableHead>}
                <TableHead className="text-right">نوع الإجازة</TableHead>
                <TableHead className="text-right">التواريخ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                {canManage && <TableHead><span className="sr-only">الإجراءات</span></TableHead>}
                {!canManage && <TableHead className="text-right">ملاحظات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      </TableCell>
                  </TableRow>
              ) : leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-3 justify-end">
                          <div className='text-right'>
                            <div className="font-medium">{request.employee.full_name}</div>
                            <div className="text-sm text-muted-foreground">{`#${request.employee_id}`}</div>
                          </div>
                          <Avatar>
                            <AvatarImage src={request.employee.avatar || undefined} alt={request.employee.full_name || ''} />
                            <AvatarFallback>{request.employee.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                    )}
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
                    {canManage && (
                        <TableCell>
                        {request.status === 'Pending' && (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                                <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                                موافقة
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(request.id)} className="text-destructive focus:text-destructive">
                                <XCircle className="ml-2 h-4 w-4" />
                                رفض
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        </TableCell>
                    )}
                    {!canManage && (
                       <TableCell>{request.notes || '-'}</TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center">
                    لا توجد طلبات إجازة حاليًا.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <RequestLeaveDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSuccess={() => {
          setIsRequestDialogOpen(false);
          fetchLeaveRequests();
        }}
      />
    </>
  );
}
