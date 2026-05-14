'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ScrapeResult {
  id: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: string;
  error?: string;
  duration?: number;
  createdAt: string;
}

interface Job {
  id: string;
  name: string;
  url: string;
  status: string;
  results: ScrapeResult[];
}

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ScrapeResult | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs?id=${params.id}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
          if (data.data.results?.length > 0) {
            setSelectedResult(data.data.results[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/jobs" className="text-blue-400 hover:underline text-sm">
            ← Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">{job.name}</h1>
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 text-sm">
            {job.url} ↗
          </a>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
          job.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {job.status}
        </span>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="lg:col-span-1 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Results ({job.results?.length || 0})</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {job.results?.map((result, index) => (
              <button
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedResult?.id === result.id
                    ? 'bg-blue-600/30 border border-blue-500'
                    : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Run #{index + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    result.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(result.createdAt).toLocaleString()}
                </p>
                {result.duration && (
                  <p className="text-gray-500 text-xs">{result.duration}ms</p>
                )}
              </button>
            ))}
            {(!job.results || job.results.length === 0) && (
              <p className="text-gray-500 text-center py-4">No results yet</p>
            )}
          </div>
        </div>

        {/* Result Detail */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Scraped Data</h2>
            {selectedResult && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedResult.data, null, 2));
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                📋 Copy JSON
              </button>
            )}
          </div>
          
          {selectedResult ? (
            <div className="space-y-4">
              {/* Data Display */}
              <div className="bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(selectedResult.data, null, 2)}
                </pre>
              </div>

              {/* Metadata */}
              {selectedResult.metadata && Object.keys(selectedResult.metadata).length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-white mb-2">Metadata</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-400 whitespace-pre-wrap">
                      {JSON.stringify(selectedResult.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedResult.error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-red-400 mb-2">Error</h3>
                  <p className="text-red-300 text-sm">{selectedResult.error}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Select a result to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
