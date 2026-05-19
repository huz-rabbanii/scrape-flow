'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Globe,
  Code,
  Clock,
  Save,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw
} from 'lucide-react';
import { SELECTOR_TEMPLATES } from '@/lib/scraper/selectors';
import { CRON_PRESETS, describeCron } from '@/lib/automation/triggers';

interface Selector {
  name: string;
  selector: string;
  extract: 'text' | 'html' | 'attribute';
  attribute?: string;
  multiple?: boolean;
}

interface ScrapeResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  duration?: number;
}

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [template, setTemplate] = useState('metadata');
  const [selectors, setSelectors] = useState<Selector[]>([
    { name: 'title', selector: 'h1', extract: 'text' }
  ]);
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [schedule, setSchedule] = useState('0 * * * *');
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  function addSelector() {
    setSelectors([...selectors, { name: '', selector: '', extract: 'text' }]);
  }

  function removeSelector(index: number) {
    setSelectors(selectors.filter((_, i) => i !== index));
  }

  function updateSelector(index: number, field: keyof Selector, value: string | boolean) {
    const updated = [...selectors];
    (updated[index] as any)[field] = value;
    setSelectors(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setScrapeResult(null);

    try {
      // Step 1: Create the job
      const createResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          url,
          selectors: useTemplate ? SELECTOR_TEMPLATES[template] : selectors,
          schedule: enableSchedule ? schedule : undefined,
        }),
      });

      const createData = await createResponse.json();
      if (!createData.success) {
        alert(`Error: ${createData.error}`);
        return;
      }

      const jobId = createData.data.id;
      setCreatedJobId(jobId);

      // Step 2: Immediately run the scrape (same as Try Demo)
      const runResponse = await fetch(`/api/jobs/${jobId}/run`, {
        method: 'POST',
      });

      const runData = await runResponse.json();
      setScrapeResult({
        success: runData.success,
        data: runData.data?.data,
        error: runData.error || runData.data?.error,
        duration: runData.data?.duration,
      });
    } catch (error) {
      console.error('Failed to create job:', error);
      setScrapeResult({ success: false, error: 'Failed to create and run job' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/dashboard/jobs"
          className="p-2 hover:bg-secondary rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Scraping Job</h1>
          <p className="text-muted-foreground">Configure a new web scraping job</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Basic Information
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">Job Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Price Monitor"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this job do?"
              rows={2}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Selectors */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Data Selectors
          </h2>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setUseTemplate(true)}
              className={`flex-1 p-3 rounded-lg border transition ${
                useTemplate ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">Use Template</p>
              <p className="text-sm text-muted-foreground">Pre-built selectors</p>
            </button>
            <button
              type="button"
              onClick={() => setUseTemplate(false)}
              className={`flex-1 p-3 rounded-lg border transition ${
                !useTemplate ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">Custom Selectors</p>
              <p className="text-sm text-muted-foreground">Define your own</p>
            </button>
          </div>

          {useTemplate ? (
            <div>
              <label className="block text-sm font-medium mb-1">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.keys(SELECTOR_TEMPLATES).map((key) => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)} ({SELECTOR_TEMPLATES[key].length} selectors)
                  </option>
                ))}
              </select>
              <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Selectors in this template:</p>
                <div className="flex flex-wrap gap-2">
                  {SELECTOR_TEMPLATES[template]?.map((sel) => (
                    <span key={sel.name} className="text-xs bg-secondary px-2 py-1 rounded">
                      {sel.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectors.map((selector, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={selector.name}
                      onChange={(e) => updateSelector(index, 'name', e.target.value)}
                      placeholder="Field name"
                      className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={selector.selector}
                      onChange={(e) => updateSelector(index, 'selector', e.target.value)}
                      placeholder="CSS selector"
                      className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    />
                    <select
                      value={selector.extract}
                      onChange={(e) => updateSelector(index, 'extract', e.target.value)}
                      className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="attribute">Attribute</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelector(index)}
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSelector}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add Selector
              </button>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Schedule (Optional)
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSchedule}
                onChange={(e) => setEnableSchedule(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Enable scheduling</span>
            </label>
          </div>

          {enableSchedule && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Preset</label>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                >
                  {Object.entries(CRON_PRESETS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace(/([A-Z])/g, ' $1').trim()} ({value})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Custom Cron</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="* * * * *"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg font-mono"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {describeCron(schedule)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/jobs"
            className="px-6 py-2 border border-border rounded-lg hover:bg-secondary transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating & Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Create & Run Job
              </>
            )}
          </button>
        </div>
      </form>

      {/* Scrape Result (shown after job creation + run) */}
      {scrapeResult && (
        <div className={`mt-6 bg-card border rounded-xl p-6 ${scrapeResult.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {scrapeResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h3 className="font-semibold">
                Scrape Result: {scrapeResult.success ? 'Success!' : 'Failed'}
              </h3>
              {scrapeResult.duration && (
                <span className="text-xs text-muted-foreground ml-2">{scrapeResult.duration}ms</span>
              )}
            </div>
            <button
              onClick={() => setScrapeResult(null)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Dismiss
            </button>
          </div>

          {scrapeResult.success && scrapeResult.data ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Scraped from <span className="text-foreground font-mono">{url}</span>
              </p>
              <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap">
                  {JSON.stringify(scrapeResult.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-red-400 text-sm">{scrapeResult.error}</p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push('/dashboard/jobs')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm"
            >
              View All Jobs
            </button>
            {createdJobId && (
              <button
                onClick={() => router.push(`/dashboard/jobs/${createdJobId}`)}
                className="border border-border px-4 py-2 rounded-lg hover:bg-secondary transition text-sm"
              >
                View This Job
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
