
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Users,
  CalendarCheck,
  Briefcase,
  Star,
  Loader2,
  FileDown,
  BarChart,
  CalendarClock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Employee } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart as RechartsBarChart
} from 'recharts';

interface Kpi {
  title: string;
  value: string | number;
  icon: React.ElementType;
}

interface ReportData {
  kpis: Kpi[];
  employeesByDept: { name: string; value: number }[];
  leavesByType: { name: string; value: number }[];
  employees: Employee[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/reports');
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات التقارير');
        }
        const data = await response.json();
        setReportData(data);
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
    fetchReportData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center">لم يتم العثور على بيانات لعرضها.</div>;
  }

  const { kpis, employeesByDept, leavesByType, employees } = reportData;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">التقارير والتحليلات</h1>
        <p className="text-muted-foreground">نظرة شاملة على بيانات الموارد البشرية في المنظمة.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الموظفين حسب القسم</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={employeesByDept}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {employeesByDept.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>أنواع الإجازات المطلوبة</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={leavesByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="عدد الطلبات"/>
                </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle>القائمة الرئيسية للموظفين</CardTitle>
                </div>
                <Button variant="outline" size="sm">
                    <FileDown className="ml-2 h-4 w-4" />
                    تصدير إلى Excel
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>القسم</TableHead>
                        <TableHead>الوظيفة</TableHead>
                        <TableHead>تاريخ التعيين</TableHead>
                        <TableHead>الحالة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map(emp => (
                        <TableRow key={emp.id}>
                            <TableCell>{emp.id}</TableCell>
                            <TableCell>{emp.full_name}</TableCell>
                            <TableCell>{emp.department?.name_ar || '-'}</TableCell>
                            <TableCell>{emp.jobTitle?.title_ar || '-'}</TableCell>
                            <TableCell>{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                            <TableCell>{emp.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
