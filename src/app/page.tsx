import Link from 'next/link';
import { 
  Globe, 
  Zap, 
  Database, 
  Clock, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Code,
  Workflow,
  BarChart3
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ScrapeFlow</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition">
              Dashboard
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition">
              Docs
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
          <Zap className="h-4 w-4" />
          Automated Data Extraction
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Web Scraping &<br />Workflow Automation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Extract data from any website, automate workflows, and schedule recurring jobs. 
          Built for developers and businesses who need reliable data extraction at scale.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition flex items-center gap-2 text-lg"
          >
            Start Scraping <ArrowRight className="h-5 w-5" />
          </Link>
          <Link 
            href="/api/scrape?url=https://example.com&template=metadata" 
            className="border border-border px-8 py-3 rounded-lg hover:bg-secondary transition text-lg"
          >
            Try API
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Code className="h-8 w-8" />}
            title="Visual Selector Builder"
            description="Point and click to select elements. No coding required for basic extractions."
          />
          <FeatureCard
            icon={<Workflow className="h-8 w-8" />}
            title="Workflow Automation"
            description="Chain multiple scraping jobs together with transforms, filters, and webhooks."
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8" />}
            title="Scheduled Jobs"
            description="Set up recurring scrapes with cron expressions. Never miss an update."
          />
          <FeatureCard
            icon={<Database className="h-8 w-8" />}
            title="Data Storage"
            description="Automatically store all extracted data with full history and versioning."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Proxy Support"
            description="Built-in proxy rotation and anti-detection measures for reliable scraping."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Analytics Dashboard"
            description="Monitor job performance, success rates, and extracted data trends."
          />
        </div>
      </section>

      {/* Code Example */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Simple API</h2>
            <p className="text-muted-foreground mb-6">
              Integrate web scraping into your applications with our REST API. 
              Extract data with a single HTTP request.
            </p>
            <ul className="space-y-3">
              {[
                'RESTful endpoints for all operations',
                'Pre-built selector templates',
                'Real-time webhooks for job completion',
                'Export to JSON, CSV, or XML',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm">
              <code>{`// Quick scrape with API
const response = await fetch('/api/scrape', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://example.com/products',
    template: 'product',
    // Or use custom selectors:
    selectors: [
      { name: 'title', selector: 'h1' },
      { name: 'price', selector: '.price' },
      { name: 'images', selector: 'img', 
        multiple: true, extract: 'attribute', 
        attribute: 'src' }
    ]
  })
});

const { data } = await response.json();
console.log(data);
// { title: "...", price: "...", images: [...] }`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start extracting data in minutes. No credit card required.
          </p>
          <Link 
            href="/dashboard" 
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition inline-flex items-center gap-2"
          >
            Open Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Built with Next.js • Deploy on Vercel</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
