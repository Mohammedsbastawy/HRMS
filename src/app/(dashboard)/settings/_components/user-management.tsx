
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2, KeyRound, Power, PowerOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AddUserDialog } from './add-user-dialog';

type User = {
    id: number;
    username: string;
    role: 'Admin' | 'HR' | 'Manager' | 'Employee';
    account_status: 'Active' | 'Inactive';
};

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }
            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 401) {
                 toast({
                    variant: 'destructive',
                    title: 'جلسة غير صالحة',
                    description: 'انتهت صلاحية جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.',
                });
                // Optionally redirect to login
                // window.location.href = '/login';
                return;
            }

            if (!response.ok) throw new Error('فشل في جلب المستخدمين');
            
            const data = await response.json();
            setUsers(data.users);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onUserAdded = () => {
        fetchUsers(); // Refetch users after a new one is added
    };

    const getStatusVariant = (status: 'Active' | 'Inactive') => {
        return status === 'Active' ? 'default' : 'destructive';
    };
    const getStatusText = (status: 'Active' | 'Inactive') => {
        return status === 'Active' ? 'نشط' : 'غير نشط';
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <CardDescription>إضافة وتعديل صلاحيات مستخدمي النظام.</CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={() => setIsAddUserOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة مستخدم</span>
                </Button>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">اسم المستخدم</TableHead>
                        <TableHead className="text-right">الدور</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                     {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : users.length > 0 ? (
                        users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                                 <Badge 
                                    variant={getStatusVariant(user.account_status)}
                                    className={user.account_status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                                >
                                    {getStatusText(user.account_status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex justify-end gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                        <DropdownMenuItem><Edit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                                        <DropdownMenuItem><KeyRound className="ml-2 h-4 w-4" />إعادة تعيين كلمة المرور</DropdownMenuItem>
                                        {user.account_status === 'Active' ? (
                                             <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                <PowerOff className="ml-2 h-4 w-4" />تعطيل الحساب
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem className="text-green-600 focus:text-green-700">
                                                <Power className="ml-2 h-4 w-4" />تفعيل الحساب
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                لا يوجد مستخدمون لعرضهم.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
            <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} onUserAdded={onUserAdded} />
        </>
    );
}

    