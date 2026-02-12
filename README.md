# Cloudflare Custom Pages

Custom pages for Cloudflare Zero Trust, providing block pages, user information displays, and DNS analytics.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/leelakanakala/cfone-custom-pages)

## Prerequisites

Before deploying, ensure you have:

- **Cloudflare Account** with Zero Trust enabled
- **API Tokens** (see [Configuration](#configuration) below)
- **Node.js 18+** (for local development only)

For Cloudflare Workers setup, see the [Workers Documentation](https://developers.cloudflare.com/workers/get-started/guide/).

## Projects Overview

### Gateway Block Page (`/cf-gateway/`)
Custom block page for Cloudflare Secure Web Gateway. Displays policy context when access is blocked, including blocked URL, categories, and policy details. Supports light/dark themes.

![Gateway Block Page](src/img/gw-block-page.png)

### Access Info Page (`/cf-access/`)
User identity and device information page. Shows WARP status, device details, and security posture checks (Crowdstrike, OS updates). Leverages Cloudflare Access authentication.

![Access Info Page](src/img/access-block-page.png)

### DNS Analytics Dashboard (`/cf-dns-dashboard/`)
Real-time DNS query analytics powered by Cloudflare's GraphQL API for fast chart rendering.

**Available Charts:**
- **DNS Query Timeline** - Query volume over time (Live, 1h, 24h, 7d, 30d)
- **Live DNS Logs** - Real-time streaming logs with 10-second refresh
- **Top 20 Allowed/Blocked Categories** - Category breakdown
- **Top 20 Queried Domains** - Most queried domain names
- **Top 20 Blocked Domains** - Blocked domain analysis
- **Newly Observed Domains** - First-seen domains
- **Geography Analysis** - Query distribution by country
- **Action Breakdown** - Allowed vs blocked pie chart
- **Application Analysis** - Traffic by application type

## Configuration

### Required Secrets

Set these using `wrangler secret put <SECRET_NAME>`:

| Secret | Required For | Permissions |
|--------|--------------|-------------|
| `BEARER_TOKEN` | Access Info Page | Zero Trust → Devices → Read, Device Posture → Read |
| `DNS_DASHBOARD_API_TOKEN` | DNS Dashboard | Account → Zero Trust → Read |
| `DNS_DASHBOARD_ACCOUNT_ID` | DNS Dashboard | Your Cloudflare Account ID |

### Gateway Block Page Setup

1. Navigate to **Zero Trust** → **Gateway** → **Firewall Policies**
2. Edit your block policy
3. Set **Block page** to: `https://your-domain.com/cf-gateway/`

### Access Info Page Setup

1. Configure Cloudflare Access for your domain
2. Set cookie domain to `.example.com` (wildcard for SSO)
3. Configure `BEARER_TOKEN` secret for device/posture data

### DNS Dashboard Setup

1. Create API token with **Account → Zero Trust → Read** permission
2. Set secrets:
   ```bash
   wrangler secret put DNS_DASHBOARD_API_TOKEN
   wrangler secret put DNS_DASHBOARD_ACCOUNT_ID
   ```

## Project Structure

```
cfone-custom-pages/
├── src/
│   ├── pages/
│   │   ├── cf-gateway/block.html
│   │   ├── cf-access/index.html
│   │   ├── coaching/index.html
│   │   └── cf-dns-dashboard/
│   │       ├── index.html
│   │       └── categoryList.js
│   ├── worker-template.js
│   └── build.js
├── main.js (auto-generated)
├── wrangler.example.jsonc
└── ARCHITECTURE.md
```

## Development

```bash
npm install
cp wrangler.example.jsonc wrangler.jsonc
# Edit wrangler.jsonc with your routes

npm run build    # Build worker
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Zero Trust Docs](https://developers.cloudflare.com/cloudflare-one/)
