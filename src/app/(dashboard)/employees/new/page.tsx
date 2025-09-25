
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Department, JobTitle, Location } from "@/lib/types";
import { EmployeeForm } from "./_components/employee-form";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function NewEmployeePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [managers, setManagers] = useState<{ id: number, full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFormData() {
      setIsLoading(true);
      try {
        const [deptsRes, jobsRes, locsRes, mgrsRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/job-titles'),
          fetch('/api/locations'),
          fetch('/api/employees?is_manager=true'),
        ]);

        if (!deptsRes.ok || !jobsRes.ok || !locsRes.ok || !mgrsRes.ok) {
          throw new Error('فشل في تحميل بيانات النموذج');
        }

        const deptsData = await deptsRes.json();
        const jobsData = await jobsRes.json();
        const locsData = await locsRes.json();
        const mgrsData = await mgrsRes.json();

        setDepartments(deptsData.departments || []);
        setJobTitles(jobsData || []);
        setLocations(locsData || []);
        setManagers(mgrsData || []);

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchFormData();
  }, [toast]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة موظف جديد</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لإضافة موظف جديد إلى النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <EmployeeForm 
            departments={departments}
            jobTitles={jobTitles}
            locations={locations}
            managers={managers}
          />
        )}
      </CardContent>
    </Card>
  );
}
