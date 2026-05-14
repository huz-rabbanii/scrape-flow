import Link from 'next/link';
import { ArrowLeft, Globe, Code, Workflow, Clock, Key } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-bold">ScrapeFlow</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span>Documentation</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to know to get started with ScrapeFlow
          </p>

          {/* Quick Start */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" id="quickstart">Quick Start</h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p>Get started with ScrapeFlow in under a minute:</p>
              <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
                <code>{`# Quick scrape any URL
curl "https://your-app.vercel.app/api/scrape?url=https://example.com&template=metadata"

# Response
{
  "success": true,
  "data": {
    "data": {
      "title": "Example Domain",
      "description": "This domain is for...",
      "ogImage": null
    },
    "duration": 234,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}`}</code>
              </pre>
            </div>
          </section>

          {/* API Reference */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" id="api">API Reference</h2>
            
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                  <code className="font-mono">/api/scrape</code>
                </div>
                <p className="text-muted-foreground mb-4">Scrape a URL with custom or template selectors</p>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`{
  "url": "https://example.com",        // Required
  "template": "product",                // OR use custom selectors
  "selectors": [                        // Custom CSS selectors
    {
      "name": "title",
      "selector": "h1",
      "extract": "text"                 // text | html | attribute
    }
  ],
  "options": {
    "includeMetadata": true,
    "includeLinks": false
  }
}`}</code>
                </pre>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">GET</span>
                  <code className="font-mono">/api/jobs</code>
                </div>
                <p className="text-muted-foreground mb-4">List all scraping jobs</p>
                <h4 className="font-semibold mb-2">Query Parameters</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><code>page</code> - Page number (default: 1)</li>
                  <li><code>pageSize</code> - Items per page (default: 10)</li>
                  <li><code>status</code> - Filter by status</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                  <code className="font-mono">/api/jobs</code>
                </div>
                <p className="text-muted-foreground mb-4">Create a new scraping job</p>
                <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`{
  "name": "Daily Price Check",
  "description": "Monitor product prices",
  "url": "https://shop.example.com/products",
  "selectors": [...],
  "schedule": "0 9 * * *"              // Cron expression
}`}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Templates */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" id="templates">Selector Templates</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'metadata', desc: 'Page title, description, OG tags' },
                { name: 'product', desc: 'E-commerce product details' },
                { name: 'article', desc: 'Blog/news article content' },
                { name: 'contact', desc: 'Email, phone, address' },
                { name: 'job', desc: 'Job listing details' },
                { name: 'property', desc: 'Real estate listing' },
                { name: 'business', desc: 'Business info & reviews' },
                { name: 'socialPost', desc: 'Social media post' },
              ].map((template) => (
                <div key={template.name} className="bg-card border border-border rounded-lg p-4">
                  <code className="text-primary font-mono">{template.name}</code>
                  <p className="text-sm text-muted-foreground mt-1">{template.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Workflows */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" id="workflows">Workflows</h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="mb-4">Chain multiple operations together:</p>
              <div className="flex items-center gap-4 flex-wrap mb-6">
                {['Scrape', 'Transform', 'Filter', 'Webhook'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm">
                      {step}
                    </span>
                    {i < 3 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
              </div>
              <h4 className="font-semibold mb-2">Available Step Types</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li><code>scrape</code> - Fetch and extract data</li>
                <li><code>transform</code> - Map, sort, flatten data</li>
                <li><code>filter</code> - Filter by conditions</li>
                <li><code>webhook</code> - Send HTTP request</li>
                <li><code>delay</code> - Wait before next step</li>
                <li><code>condition</code> - Branch based on data</li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to start scraping?</h2>
            <p className="text-muted-foreground mb-6">
              Create your first job in the dashboard
            </p>
            <Link 
              href="/dashboard" 
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition inline-block"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
