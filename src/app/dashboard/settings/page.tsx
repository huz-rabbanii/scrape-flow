'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Database, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultTimeout: 30000,
    maxRetries: 3,
    respectRobotsTxt: true,
    defaultUserAgent: 'ScrapeFlow/1.0',
    enableNotifications: true,
    webhookUrl: '',
    rateLimit: 60,
  });

  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In production, save to database or localStorage
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your scraping preferences</p>
      </div>

      {/* Scraping Settings */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Scraping Settings
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1">Default Timeout (ms)</label>
          <input
            type="number"
            value={settings.defaultTimeout}
            onChange={(e) => setSettings({ ...settings, defaultTimeout: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Maximum time to wait for page response
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Retries</label>
          <input
            type="number"
            value={settings.maxRetries}
            onChange={(e) => setSettings({ ...settings, maxRetries: parseInt(e.target.value) })}
            min={0}
            max={10}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Number of retry attempts for failed requests
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Default User Agent</label>
          <input
            type="text"
            value={settings.defaultUserAgent}
            onChange={(e) => setSettings({ ...settings, defaultUserAgent: e.target.value })}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.respectRobotsTxt}
              onChange={(e) => setSettings({ ...settings, respectRobotsTxt: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="font-medium">Respect robots.txt</span>
          </label>
          <p className="text-sm text-muted-foreground mt-1 ml-6">
            Follow website crawling rules
          </p>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Rate Limiting
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1">Requests per Minute</label>
          <input
            type="number"
            value={settings.rateLimit}
            onChange={(e) => setSettings({ ...settings, rateLimit: parseInt(e.target.value) })}
            min={1}
            max={1000}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Maximum number of requests per minute to avoid being blocked
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </h2>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="font-medium">Enable notifications</span>
          </label>
          <p className="text-sm text-muted-foreground mt-1 ml-6">
            Receive notifications for job completions and failures
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Webhook URL (Optional)</label>
          <input
            type="url"
            value={settings.webhookUrl}
            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
            placeholder="https://your-server.com/webhook"
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Receive webhook notifications for all job events
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
