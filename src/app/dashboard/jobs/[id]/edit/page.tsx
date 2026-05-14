'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Selector {
  name: string;
  selector: string;
  extract: string;
  attribute?: string;
  multiple?: boolean;
  transform?: string;
}

interface Job {
  id: string;
  name: string;
  description: string;
  url: string;
  selectors: Selector[];
  schedule: string | null;
  status: string;
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [schedule, setSchedule] = useState('');

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs?id=${params.id}`);
        const data = await res.json();
        if (data.success) {
          const j = data.data;
          setJob(j);
          setName(j.name);
          setDescription(j.description || '');
          setUrl(j.url);
          setSelectors(j.selectors || []);
          setEnableSchedule(!!j.schedule);
          setSchedule(j.schedule || '0 */6 * * *');
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id]);

  const addSelector = () => {
    setSelectors([...selectors, { name: '', selector: '', extract: 'text' }]);
  };

  const updateSelector = (index: number, field: keyof Selector, value: string | boolean) => {
    const updated = [...selectors];
    updated[index] = { ...updated[index], [field]: value };
    setSelectors(updated);
  };

  const removeSelector = (index: number) => {
    setSelectors(selectors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/jobs?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          url,
          selectors,
          schedule: enableSchedule ? schedule : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/jobs');
      } else {
        alert('Failed to update job: ' + data.error);
      }
    } catch (error) {
      alert('Error updating job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-300">Job not found</h2>
        <Link href="/dashboard/jobs" className="text-blue-400 hover:underline mt-4 inline-block">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/jobs" className="text-blue-400 hover:underline text-sm">
          ← Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">✏️ Edit Job</h1>
        <p className="text-gray-400 mt-1">Modify your scraping job configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">📋 Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Target URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Selectors */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">🎯 Data Selectors</h2>
            <button
              type="button"
              onClick={addSelector}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              + Add Selector
            </button>
          </div>

          <div className="space-y-4">
            {selectors.map((sel, index) => (
              <div key={index} className="flex gap-3 items-start bg-gray-900/50 p-3 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={sel.name}
                    onChange={(e) => updateSelector(index, 'name', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="CSS selector"
                    value={sel.selector}
                    onChange={(e) => updateSelector(index, 'selector', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  />
                  <select
                    value={sel.extract}
                    onChange={(e) => updateSelector(index, 'extract', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="html">HTML</option>
                    <option value="attribute">Attribute</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={sel.multiple || false}
                        onChange={(e) => updateSelector(index, 'multiple', e.target.checked)}
                        className="rounded border-gray-600 bg-gray-800"
                      />
                      Multiple
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSelector(index)}
                  className="text-red-400 hover:text-red-300 p-2"
                >
                  🗑️
                </button>
              </div>
            ))}

            {selectors.length === 0 && (
              <p className="text-gray-500 text-center py-4">No selectors. Click "Add Selector" to start.</p>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">⏰ Schedule (Optional)</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableSchedule}
                onChange={(e) => setEnableSchedule(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500"
              />
              <span className="text-gray-300 text-sm">Enable scheduling</span>
            </label>
          </div>

          {enableSchedule && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cron Expression</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="0 */6 * * * (every 6 hours)"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {[
                  { label: 'Every hour', value: '0 * * * *' },
                  { label: 'Every 6 hours', value: '0 */6 * * *' },
                  { label: 'Daily at 9am', value: '0 9 * * *' },
                  { label: 'Weekly', value: '0 0 * * 0' },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSchedule(preset.value)}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '💾 Saving...' : '💾 Save Changes'}
          </button>
          <Link
            href="/dashboard/jobs"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-center transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
