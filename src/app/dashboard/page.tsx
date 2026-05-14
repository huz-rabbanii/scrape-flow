'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Plus,
  Play,
  RefreshCw
} from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  totalDataPoints: number;
  avgResponseTime: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
        setActivity(data.data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your scraping operations</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats?.totalJobs ?? 0}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs ?? 0}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="Completed Today"
          value={stats?.completedToday ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Failed Today"
          value={stats?.failedToday ?? 0}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Performance</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Data Points</span>
                <span className="font-medium">{stats?.totalDataPoints?.toLocaleString() ?? 0}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Avg Response Time</span>
                <span className="font-medium">{formatDuration(stats?.avgResponseTime ?? 0)}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-green-500">
                  {stats && stats.completedToday + stats.failedToday > 0
                    ? Math.round((stats.completedToday / (stats.completedToday + stats.failedToday)) * 100)
                    : 100}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${stats && stats.completedToday + stats.failedToday > 0
                      ? Math.round((stats.completedToday / (stats.completedToday + stats.failedToday)) * 100)
                      : 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/jobs/new"
              className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition"
            >
              <Plus className="h-6 w-6 mb-2 text-primary" />
              <span className="text-sm">New Job</span>
            </Link>
            <Link
              href="/dashboard/workflows/new"
              className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition"
            >
              <Play className="h-6 w-6 mb-2 text-green-500" />
              <span className="text-sm">New Workflow</span>
            </Link>
            <button
              onClick={fetchDashboardData}
              className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition"
            >
              <RefreshCw className="h-6 w-6 mb-2 text-blue-500" />
              <span className="text-sm">Refresh</span>
            </button>
            <Link
              href="/dashboard/jobs"
              className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition"
            >
              <FileText className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="text-sm">View Jobs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Activity</h3>
          <Link href="/dashboard/jobs" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        
        {activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Create your first scraping job to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
              >
                {item.type === 'job_completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
                {item.metadata?.duration && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(item.metadata.duration as number)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
