'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2,
  RefreshCw,
  Workflow,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  _count?: {
    jobs: number;
    executions: number;
  };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  }

  async function executeWorkflow(id: string) {
    try {
      const response = await fetch(`/api/workflows/${id}/execute`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert('Workflow executed successfully!');
        fetchWorkflows();
      } else {
        alert(`Failed to execute workflow: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  }

  async function deleteWorkflow(id: string) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const response = await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setWorkflows(workflows.filter(w => w.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
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
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Automate complex scraping tasks</p>
        </div>
        <Link
          href="/dashboard/workflows/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </Link>
      </div>

      {/* Workflows grid */}
      {workflows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-6">
            Create workflows to chain multiple scraping jobs together
          </p>
          <Link
            href="/dashboard/workflows/new"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <div 
              key={workflow.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  workflow.status === 'ACTIVE' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {workflow.status}
                </span>
              </div>

              <h3 className="font-semibold mb-1">{workflow.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {workflow.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {workflow._count?.executions || 0} runs
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {workflow._count?.jobs || 0} jobs
                </span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => executeWorkflow(workflow.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
                >
                  <Play className="h-4 w-4" />
                  Run
                </button>
                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  className="p-2 hover:bg-secondary rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
