'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Save,
  Workflow,
  Globe,
  Filter,
  GitMerge,
  Webhook,
  Clock
} from 'lucide-react';
import { CRON_PRESETS, describeCron } from '@/lib/automation/triggers';

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
}

const stepTypes = [
  { type: 'scrape', label: 'Scrape', icon: Globe, description: 'Fetch and extract data from URL' },
  { type: 'transform', label: 'Transform', icon: GitMerge, description: 'Apply transformations to data' },
  { type: 'filter', label: 'Filter', icon: Filter, description: 'Filter data based on conditions' },
  { type: 'webhook', label: 'Webhook', icon: Webhook, description: 'Send HTTP request' },
  { type: 'delay', label: 'Delay', icon: Clock, description: 'Wait for specified duration' },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [triggerType, setTriggerType] = useState<'manual' | 'schedule' | 'webhook'>('manual');
  const [schedule, setSchedule] = useState('0 * * * *');

  function addStep(type: string) {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
      config: getDefaultConfig(type),
    };
    setSteps([...steps, newStep]);
  }

  function getDefaultConfig(type: string): Record<string, unknown> {
    switch (type) {
      case 'scrape':
        return { url: '', selectors: [] };
      case 'transform':
        return { input: '', operations: [] };
      case 'filter':
        return { input: '', conditions: [] };
      case 'webhook':
        return { url: '', method: 'POST' };
      case 'delay':
        return { duration: 1000 };
      default:
        return {};
    }
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: string, value: unknown) {
    const updated = [...steps];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].config[field] = value;
    }
    setSteps(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          steps,
          triggers: [{
            type: triggerType,
            config: triggerType === 'schedule' ? { cron: schedule } : {},
          }],
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/dashboard/workflows');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/dashboard/workflows"
          className="p-2 hover:bg-secondary rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Workflow</h1>
          <p className="text-muted-foreground">Chain multiple steps together</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Workflow Details
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Price Monitor"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              rows={2}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Trigger */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Trigger</h2>

          <div className="grid grid-cols-3 gap-3">
            {(['manual', 'schedule', 'webhook'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTriggerType(type)}
                className={`p-3 rounded-lg border text-center transition ${
                  triggerType === type
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium capitalize">{type}</p>
              </button>
            ))}
          </div>

          {triggerType === 'schedule' && (
            <div>
              <label className="block text-sm font-medium mb-1">Schedule</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
              >
                {Object.entries(CRON_PRESETS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">{describeCron(schedule)}</p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Workflow Steps</h2>

          {/* Add step buttons */}
          <div className="flex flex-wrap gap-2">
            {stepTypes.map((stepType) => (
              <button
                key={stepType.type}
                type="button"
                onClick={() => addStep(stepType.type)}
                className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition text-sm"
              >
                <stepType.icon className="h-4 w-4" />
                {stepType.label}
              </button>
            ))}
          </div>

          {/* Steps list */}
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <p>No steps added yet</p>
              <p className="text-sm">Click a button above to add a step</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => {
                const StepIcon = stepTypes.find(s => s.type === step.type)?.icon || Globe;
                return (
                  <div 
                    key={step.id}
                    className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm font-mono">{index + 1}</span>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm"
                      />
                      
                      {step.type === 'scrape' && (
                        <input
                          type="url"
                          value={(step.config.url as string) || ''}
                          onChange={(e) => updateStep(index, 'url', e.target.value)}
                          placeholder="URL to scrape"
                          className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm"
                        />
                      )}
                      
                      {step.type === 'webhook' && (
                        <input
                          type="url"
                          value={(step.config.url as string) || ''}
                          onChange={(e) => updateStep(index, 'url', e.target.value)}
                          placeholder="Webhook URL"
                          className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm"
                        />
                      )}
                      
                      {step.type === 'delay' && (
                        <input
                          type="number"
                          value={(step.config.duration as number) || 1000}
                          onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value))}
                          placeholder="Duration (ms)"
                          className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/workflows"
            className="px-6 py-2 border border-border rounded-lg hover:bg-secondary transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || steps.length === 0}
            className="flex-1 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
}
