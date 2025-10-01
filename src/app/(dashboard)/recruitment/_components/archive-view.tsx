
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
import type { Job, Applicant } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export function ArchiveView() {
    const [archivedJobs, setArchivedJobs] = useState<Job[]>([]);
    const [rejectedApplicants, setRejectedApplicants] = useState<Applicant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchArchiveData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }
                const headers = { 'Authorization': `Bearer ${token}` };

                const [jobsRes, applicantsRes] = await Promise.all([
                    fetch('/api/recruitment/jobs?status=Closed', { headers }),
                    fetch('/api/recruitment/applicants?stage=Rejected', { headers })
                ]);
                
                if (!jobsRes.ok || !applicantsRes.ok) {
                    throw new Error('فشل في جلب بيانات الأرشيف');
                }

                const jobsData = await jobsRes.json();
                const applicantsData = await applicantsRes.json();
                
                setArchivedJobs(jobsData.jobs || []);
                setRejectedApplicants(applicantsData.applicants || []);

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'خطأ', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchArchiveData();
    }, [router, toast]);


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>أرشيف الوظائف (المغلقة)</CardTitle>
                    <CardDescription>قائمة بالوظائف التي تم إغلاقها أو ملؤها.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المسمى الوظيفي</TableHead>
                                <TableHead>القسم</TableHead>
                                <TableHead>تاريخ الإنشاء</TableHead>
                                <TableHead>سبب الإغلاق</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                            ) : archivedJobs.length > 0 ? (
                                archivedJobs.map(job => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.department?.name_ar || '-'}</TableCell>
                                        <TableCell>{new Date(job.created_at).toLocaleDateString('ar-EG')}</TableCell>
                                        <TableCell>{(job as any).close_reason || 'تم التوظيف'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">لا توجد وظائف مؤرشفة.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>أرشيف المتقدمين (المرفوضين)</CardTitle>
                    <CardDescription>قائمة بالمتقدمين الذين تم رفضهم أثناء عملية التوظيف.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المتقدم</TableHead>
                                <TableHead>الوظيفة المتقدم لها</TableHead>
                                <TableHead>تاريخ التقديم</TableHead>
                                <TableHead>المصدر</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                            ) : rejectedApplicants.length > 0 ? (
                                rejectedApplicants.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3 justify-end">
                                                <div>
                                                    <div className="font-medium">{app.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">{app.email}</div>
                                                </div>
                                                <Avatar>
                                                    <AvatarImage src={app.avatar} />
                                                    <AvatarFallback>{app.full_name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </TableCell>
                                        <TableCell>{app.job?.title || '-'}</TableCell>
                                        <TableCell>{new Date(app.created_at).toLocaleDateString('ar-EG')}</TableCell>
                                        <TableCell>{app.source}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">لا يوجد متقدمون مرفوضون.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

