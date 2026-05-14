'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { formatDate, generateApiKey } from '@/lib/utils';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  lastUsed?: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  // For demo purposes, we'll use local state
  // In production, these would be stored in the database

  function createKey() {
    if (!newKeyName.trim()) return;
    
    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: generateApiKey(),
      scopes: ['read', 'write'],
      createdAt: new Date().toISOString(),
    };
    
    setKeys([newKey, ...keys]);
    setNewKeyName('');
    setShowNewKeyForm(false);
    
    // Reveal new key automatically
    setRevealedKeys(new Set([newKey.id]));
  }

  function deleteKey(id: string) {
    if (!confirm('Are you sure? This API key will stop working immediately.')) return;
    setKeys(keys.filter(k => k.id !== id));
  }

  function toggleReveal(id: string) {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }
    setRevealedKeys(newRevealed);
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    alert('API key copied to clipboard');
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API access keys</p>
        </div>
        <button
          onClick={() => setShowNewKeyForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New API Key
        </button>
      </div>

      {/* New key form */}
      {showNewKeyForm && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Create New API Key</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production, Testing)"
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={createKey}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewKeyForm(false)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-500">Keep your API keys secure</p>
          <p className="text-sm text-muted-foreground">
            Never share your API keys in public repositories or client-side code.
            If a key is compromised, delete it immediately and create a new one.
          </p>
        </div>
      </div>

      {/* API Keys list */}
      {keys.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No API keys</h3>
          <p className="text-muted-foreground mb-6">
            Create an API key to start using the scraping API
          </p>
          <button
            onClick={() => setShowNewKeyForm(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Key</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Created</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-secondary/30 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {key.scopes.join(', ')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                        {revealedKeys.has(key.id) 
                          ? key.key 
                          : `${key.key.substring(0, 7)}${'*'.repeat(20)}`
                        }
                      </code>
                      <button
                        onClick={() => toggleReveal(key.id)}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        {revealedKeys.has(key.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyKey(key.key)}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(key.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Usage example */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Usage Example</h3>
        <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
          <code>{`curl -X POST "https://your-app.vercel.app/api/scrape" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "template": "metadata"
  }'`}</code>
        </pre>
      </div>
    </div>
  );
}
