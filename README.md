# ScrapeFlow

**Automated Data Extraction and Workflow Automation System**

A modern, full-stack web scraping platform built with Next.js 14, designed for developers and businesses who need reliable data extraction at scale. Deploy on Vercel with one click.

![ScrapeFlow Dashboard](https://via.placeholder.com/800x400?text=ScrapeFlow+Dashboard)

## Features

- **Visual Selector Builder** - Point and click to select elements
- **Pre-built Templates** - Ready-to-use selectors for common use cases (products, articles, contacts, etc.)
- **Workflow Automation** - Chain scraping jobs with transforms, filters, and webhooks
- **Scheduled Jobs** - Cron-based scheduling for recurring scrapes
- **REST API** - Full API access for integration
- **Dashboard** - Real-time monitoring and analytics
- **Export Options** - JSON, CSV, XML output formats

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL with Prisma ORM
- **Scraping**: Cheerio for HTML parsing
- **Scheduling**: Vercel Cron Jobs
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Vercel Postgres)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd scrape-flow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Update .env with your database URL
# DATABASE_URL="postgresql://..."

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/scrape-flow)

### Manual Deploy

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `CRON_SECRET` - Secret for cron endpoint authentication
4. Deploy!

### Setting up Vercel Postgres

1. Go to your Vercel project dashboard
2. Click "Storage" → "Create Database" → "Postgres"
3. Copy the connection string to your environment variables

## API Documentation

### Quick Scrape

```bash
# GET - Quick scrape with template
curl "https://your-app.vercel.app/api/scrape?url=https://example.com&template=metadata"

# POST - Custom scrape
curl -X POST "https://your-app.vercel.app/api/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/products/item",
    "selectors": [
      { "name": "title", "selector": "h1", "extract": "text" },
      { "name": "price", "selector": ".price", "extract": "text" },
      { "name": "images", "selector": "img", "multiple": true, "extract": "attribute", "attribute": "src" }
    ]
  }'
```

### Available Templates

| Template | Description | Fields |
|----------|-------------|--------|
| `metadata` | Page metadata | title, description, keywords, ogImage |
| `product` | E-commerce product | title, price, description, image, rating |
| `article` | News/blog article | title, author, date, content, tags |
| `contact` | Contact information | email, phone, address, social |
| `job` | Job listing | title, company, location, salary, description |
| `property` | Real estate | title, price, address, beds, baths, sqft |

### Jobs API

```bash
# Create a job
curl -X POST "https://your-app.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Price Check",
    "url": "https://example.com/products",
    "selectors": [...],
    "schedule": "0 9 * * *"
  }'

# List jobs
curl "https://your-app.vercel.app/api/jobs"

# Run a job
curl -X POST "https://your-app.vercel.app/api/jobs/{id}/run"

# Delete a job
curl -X DELETE "https://your-app.vercel.app/api/jobs?id={id}"
```

### Workflows API

```bash
# Create a workflow
curl -X POST "https://your-app.vercel.app/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Price Monitor Workflow",
    "steps": [
      {
        "id": "scrape",
        "type": "scrape",
        "name": "Fetch prices",
        "config": { "url": "...", "selectors": [...] }
      },
      {
        "id": "filter",
        "type": "filter",
        "name": "Filter low prices",
        "config": {
          "input": "{{scrape}}",
          "conditions": [{ "field": "price", "operator": "lessThan", "value": 100 }]
        }
      },
      {
        "id": "notify",
        "type": "webhook",
        "name": "Send notification",
        "config": { "url": "https://your-webhook.com", "body": "{{filter}}" }
      }
    ],
    "triggers": [{ "type": "schedule", "config": { "cron": "0 */6 * * *" } }]
  }'

# Execute a workflow
curl -X POST "https://your-app.vercel.app/api/workflows/{id}/execute"
```

## Workflow Step Types

| Type | Description |
|------|-------------|
| `scrape` | Fetch and extract data from URL |
| `transform` | Apply transformations (map, sort, filter, etc.) |
| `filter` | Filter data based on conditions |
| `merge` | Combine multiple data sources |
| `split` | Split data into chunks or groups |
| `webhook` | Send HTTP request |
| `delay` | Wait for specified duration |
| `condition` | Branch based on conditions |
| `loop` | Iterate over array items |

## Project Structure

```
scrape-flow/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── scrape/    # Scraping endpoint
│   │   │   ├── jobs/      # Jobs CRUD
│   │   │   ├── workflows/ # Workflows CRUD
│   │   │   └── cron/      # Scheduled jobs runner
│   │   ├── dashboard/     # Dashboard pages
│   │   └── page.tsx       # Landing page
│   ├── components/        # React components
│   ├── lib/
│   │   ├── scraper/       # Scraping engine
│   │   ├── automation/    # Workflow engine
│   │   ├── db.ts          # Database client
│   │   └── utils.ts       # Utilities
│   └── types/             # TypeScript types
├── vercel.json            # Vercel configuration
└── package.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `CRON_SECRET` | Secret for cron authentication | Recommended |
| `NEXT_PUBLIC_APP_URL` | Public app URL | No |

## Limitations & Considerations

### Vercel Serverless Limits
- Function timeout: 10s (Hobby) / 60s (Pro)
- Memory: 1024MB (Hobby) / 3008MB (Pro)
- Payload size: 4.5MB

### For Heavy Scraping
If you need to scrape JavaScript-rendered pages or handle heavy loads:
1. Use a headless browser service (Browserless, ScrapingBee)
2. Deploy scraping workers on Railway/Render
3. Use ScrapeFlow as the orchestration layer

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with Next.js • Deploy on Vercel
