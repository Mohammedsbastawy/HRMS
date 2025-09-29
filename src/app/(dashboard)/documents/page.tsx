
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, Search, ListFilter, FileDown, BellRing, Eye, FileArchive } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import type { EmployeeWithCompliance } from '@/lib/types';
import { Input } from '@/components/ui/input';

const ComplianceBar = ({ value }: { value: number }) => {
    let colorClass = 'bg-green-500';
    if (value < 60) colorClass = 'bg-red-500';
    else if (value < 85) colorClass = 'bg-amber-500';

    return <Progress value={value} indicatorClassName={colorClass} />;
};

export default function DocumentsOverviewPage() {
    const [employees, setEmployees] = useState<EmployeeWithCompliance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchOverview() {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }
                const response = await fetch(`/api/documents/overview`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('فشل في جلب بيانات نظرة عامة المستندات');
                const data = await response.json();
                
                setEmployees(data.employees_compliance);

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
        fetchOverview();
    }, [router, toast]);

    const formatRelativeTime = (isoDate: string) => {
        if (isoDate === "لم يحدث") return isoDate;
        try {
            const date = new Date(isoDate);
            const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
            interval = seconds / 2592000;
            if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
            interval = seconds / 86400;
            if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
            interval = seconds / 3600;
            if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
            interval = seconds / 60;
            if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
            return `منذ لحظات`;
        } catch (e) {
            return "غير معروف";
        }
    }


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>مركز مستندات الموظفين</CardTitle>
                        <CardDescription>
                            نظرة عامة على حالة الامتثال لمستندات الموظفين.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" disabled>
                            <FileDown className="ml-2 h-4 w-4" />
                            تصدير
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            <BellRing className="ml-2 h-4 w-4" />
                            إرسال تذكيرات
                        </Button>
                    </div>
                </div>
                 <div className="mt-4 flex items-center gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="ابحث بالاسم أو الكود..."
                        className="w-full appearance-none bg-background pl-8"
                        disabled
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 gap-1 text-sm" disabled>
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">فلترة</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الموظف</TableHead>
                            <TableHead className="text-right">القسم / الوظيفة</TableHead>
                            <TableHead className="w-[150px] text-right">حالة الامتثال</TableHead>
                            <TableHead className="text-right">ناقص</TableHead>
                            <TableHead className="text-right">ينتهي قريبًا</TableHead>
                            <TableHead className="text-right">آخر تحديث</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                    <p>جاري تحميل البيانات...</p>
                                </TableCell>
                            </TableRow>
                        ) : employees.length > 0 ? (
                            employees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div>
                                                <div className="font-medium">{emp.full_name}</div>
                                                <div className="text-xs text-muted-foreground">#{emp.id}</div>
                                            </div>
                                             <Avatar>
                                                <AvatarImage src={emp.avatar} alt={emp.full_name} />
                                                <AvatarFallback>{emp.full_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium">{emp.department?.name_ar || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{emp.jobTitle?.title_ar || '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs font-mono">{emp.compliance_percent || 0}%</span>
                                            <ComplianceBar value={emp.compliance_percent || 0} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{emp.missing_docs_count}</TableCell>
                                    <TableCell className="text-right text-amber-600 font-medium">{emp.expiring_docs_count}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{formatRelativeTime(emp.last_updated)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => router.push(`/documents/${emp.id}`)}>
                                                    <Eye className="ml-2 h-4 w-4" />
                                                    عرض قائمة المستندات
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>
                                                    <FileArchive className="ml-2 h-4 w-4" />
                                                    تصدير ZIP
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>
                                                    <BellRing className="ml-2 h-4 w-4" />
                                                    إرسال تذكير
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center">
                                    لا يوجد موظفون لعرضهم.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
