'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils';

interface Job {
  id: string;
  name: string;
  description?: string;
  url: string;
  status: string;
  schedule?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  _count?: {
    results: number;
  };
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  PENDING: { icon: <Clock className="h-4 w-4" />, color: 'text-yellow-500', label: 'Pending' },
  RUNNING: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: 'text-blue-500', label: 'Running' },
  COMPLETED: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500', label: 'Completed' },
  FAILED: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-500', label: 'Failed' },
  SCHEDULED: { icon: <Clock className="h-4 w-4" />, color: 'text-purple-500', label: 'Scheduled' },
  PAUSED: { icon: <Pause className="h-4 w-4" />, color: 'text-gray-500', label: 'Paused' },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runJob(jobId: string) {
    setRunningJob(jobId);
    try {
      const response = await fetch(`/api/jobs/${jobId}/run`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        // Refresh jobs list
        fetchJobs();
      } else {
        alert(`Failed to run job: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to run job:', error);
      alert('Failed to run job');
    } finally {
      setRunningJob(null);
    }
  }

  async function deleteJob(jobId: string) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setJobs(jobs.filter(j => j.id !== jobId));
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scraping Jobs</h1>
          <p className="text-muted-foreground">Manage your web scraping jobs</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
          <p className="text-muted-foreground mb-6">Create your first scraping job to get started</p>
          <Link
            href="/dashboard/jobs/new"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Job
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Last Run</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Results</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const status = statusConfig[job.status] || statusConfig.PENDING;
                return (
                  <tr key={job.id} className="hover:bg-secondary/30 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{job.name}</p>
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {new URL(job.url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${status.color}`}>
                        {status.icon}
                        <span className="text-sm">{status.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {job.lastRunAt ? formatDate(job.lastRunAt) : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm">{job._count?.results ?? 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runJob(job.id)}
                          disabled={runningJob === job.id || job.status === 'RUNNING'}
                          className="p-2 hover:bg-secondary rounded-lg transition disabled:opacity-50"
                          title="Run now"
                        >
                          {runningJob === job.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </button>
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="p-2 hover:bg-secondary rounded-lg transition"
                          title="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="p-2 hover:bg-secondary rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
