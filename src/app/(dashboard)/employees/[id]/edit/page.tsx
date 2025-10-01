
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Department, JobTitle, Location, Employee } from "@/lib/types";
import { EmployeeForm } from "../../new/_components/employee-form";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function EditEmployeePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [managers, setManagers] = useState<{ id: number, full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const fetchFormData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
            return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };

        const [employeeRes, deptsRes, jobsRes, locsRes, mgrsRes] = await Promise.all([
            fetch(`/api/employees/${id}`, { headers }),
            fetch('/api/departments', { headers }),
            fetch('/api/job-titles', { headers }),
            fetch('/api/locations', { headers }),
            fetch(`/api/employees?is_manager=true&exclude_id=${id}`, { headers }),
        ]);

        const responses = [employeeRes, deptsRes, jobsRes, locsRes, mgrsRes];
        for (const res of responses) {
            if (res.status === 401) {
                toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
                router.push('/login');
                return;
            }
            if (!res.ok) throw await res.json();
        }
        
        const employeeData = await employeeRes.json();
        const deptsData = await deptsRes.json();
        const jobsData = await jobsRes.json();
        const locsData = await locsRes.json();
        const mgrsData = await mgrsRes.json();

        setEmployee(employeeData);
        setDepartments(deptsData.departments || []);
        setJobTitles(jobsData || []);
        setLocations(locsData.locations || []);
        setManagers(mgrsData.employees || []);

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "خطأ في تحميل بيانات النموذج",
          description: error.message,
          details: error
        });
      } finally {
        setIsLoading(false);
      }
  }, [id, toast, router]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>تعديل بيانات الموظف</CardTitle>
        <CardDescription>
          تحديث معلومات الموظف {employee ? `"${employee.full_name}"` : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mr-2">جاري تحميل البيانات...</p>
          </div>
        ) : employee ? (
          <EmployeeForm 
            departments={departments}
            jobTitles={jobTitles}
            locations={locations}
            managers={managers}
            employee={employee}
          />
        ) : (
          <div className="text-center text-muted-foreground">لم يتم العثور على بيانات الموظف.</div>
        )}
      </CardContent>
    </Card>
  );
}
