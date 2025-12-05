"use client";

import { useSession } from "next-auth/react";
import {
  Plus,
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import ProjectCard from "@/components/project-card";
import Link from "next/link";

// --- Types ---
// 1. Updated ID to string (UUID)
// 2. Added optional analytics fields for UI display
interface ProjectType {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true); // Track data loading state

  useEffect(() => {
    const fetchProjects = async () => {
      // Don't fetch if not authenticated
      if (status !== "authenticated") return;

      try {
        const response = await fetch('/api/project', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();

        if (data.ok && Array.isArray(data.data)) {
          // --- MOCK ANALYTICS MERGE ---
          // Since DB only gives name/domain, we add fake stats here so the UI doesn't break
          const projectsWithStats = data.data.map((proj: ProjectType) => ({
            ...proj,
            visits: Math.floor(Math.random() * 5000) + "k", // Fake visits
            trend: "+" + Math.floor(Math.random() * 20) + "%", // Fake trend
            chart: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50)) // Fake sparkline
          }));

          setProjects(projectsWithStats);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status]);

  const deleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  const handleToggle = (id: string) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 py-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Projects</h2>
          {/* Optional: Add Project Button could go here */}
        </div>

        {/* --- Main Grid Content --- */}
        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onDelete={(id) => deleteProject(id)}
                onToggleActive={(id) => handleToggle(id)}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-dashed border-slate-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center text-center p-10">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <Plus className="text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium">No projects yet</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Create your first project to get started.
                </p>
                <Link href={'/dashboard/new'} > 
                  <Button className="mt-4 bg-green-600 hover:bg-green-600/80">
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}