# DNS Analytics Dashboard Integration

## Overview

The DNS Analytics Dashboard has been successfully integrated into the cfone-custom-pages project. It provides comprehensive DNS query analytics and monitoring for Zero Trust Gateway traffic with real-time insights into DNS traffic patterns, security trends, and query behaviors.

## Features

### 📊 Dashboard Capabilities
- **N-Day Query Trends**: Stacked bar chart showing daily allowed vs blocked DNS queries
- **Interactive Charts**: Click on any bar in the trend chart to see detailed query breakdowns by category and domain
- **Top 20 Allowed Categories**: Most active DNS query categories that were allowed
- **Top 20 Blocked Categories**: DNS categories blocked by security policies
- **Top 20 Query Names**: Most frequently queried domain names
- **Real-time Metrics**: Total queries, allowed/blocked counts, and block rate percentages
- **Time Range Selection**: View data for last 24 hours, 7 days, or 30 days
- **Theme Support**: Matches existing light/dark theme system

### 🎯 Key Metrics Tracked
- Daily query volume analysis
- Category-based traffic segmentation
- Security policy effectiveness tracking
- Query pattern identification

## Access

The DNS dashboard is available at:
```
https://dash.0security.net/dns
```

## Configuration

### 1. Environment Variables

The DNS dashboard requires two environment variables:

#### DNS_DASHBOARD_API_TOKEN
API token with the following permissions:
- **Account:Cloudflare Zero Trust:Read**
- **Account:Read**

Set this as a secret:
```bash
wrangler secret put DNS_DASHBOARD_API_TOKEN
```

#### DNS_DASHBOARD_ACCOUNT_ID
Your Cloudflare account ID.

Set this as a secret:
```bash
wrangler secret put DNS_DASHBOARD_ACCOUNT_ID
```

### 2. Update wrangler.jsonc

Ensure your `wrangler.jsonc` includes the DNS dashboard route:

```jsonc
{
  "routes": [
    {
      "pattern": "dash.0security.net/dns*",
      "zone_name": "0security.net"
    }
  ]
}
```

### 3. Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom token** template
4. Set permissions:
   - **Account** → **Cloudflare Zero Trust** → **Read**
   - **Account** → **Account Settings** → **Read**
5. Set **Account Resources** to your specific account
6. Create token and save it securely

### 4. Deploy

```bash
# Build the worker
npm run build

# Deploy to Cloudflare
npm run deploy
```

## API Endpoints

The dashboard exposes the following API endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /dns/` | Main dashboard UI |
| `GET /dns/api/monthly-stats` | Total queries, allowed/blocked counts |
| `GET /dns/api/30day` | Daily query trends (allowed/blocked) |
| `GET /dns/api/top-allowed` | Top 20 allowed DNS categories |
| `GET /dns/api/top-blocked` | Top 20 blocked DNS categories |
| `GET /dns/api/top-queries` | Top 20 most queried domain names |
| `GET /dns/api/query-details` | Detailed query breakdown by category and domain for a specific date/time |

All API endpoints support a `timeRange` query parameter:
- `24h` - Last 24 hours
- `7d` - Last 7 days (default)
- `30d` - Last 30 days

Example:
```
GET /dns/api/monthly-stats?timeRange=30d
GET /dns/api/query-details?date=2026-02-08&type=blocked&timeRange=7d
```

## GraphQL Architecture

The dashboard fetches data from Cloudflare's GraphQL Analytics API (`https://api.cloudflare.com/client/v4/graphql`). Each chart uses specific GraphQL datasets optimized for different query patterns.

### GraphQL Datasets Used

| Dataset | Purpose | Dimensions |
|---------|---------|------------|
| `gatewayResolverQueriesAdaptiveGroups` | Query counts, blocked domains, category analysis | `queryName`, `categoryIds`, `resolverDecision`, `datetimeHour` |
| `gatewayResolverByCategoryAdaptiveGroups` | Allowed categories breakdown | `categoryId` |

### Resolver Decision Codes

The `resolverDecision` field indicates how each DNS query was handled:

| Code | Decision | Classification |
|------|----------|----------------|
| 0 | Unknown | Allowed |
| 1 | Allowed | Allowed |
| 2 | Blocked by policy | Blocked |
| 3 | Blocked by category | Blocked |
| 4 | Allowed by policy | Allowed |
| 5 | Allowed by category | Allowed |
| 6 | Blocked by malware | Blocked |
| 7 | Safe search applied | Allowed |
| 8 | Override applied | Allowed |
| 9 | Blocked by DLP | Blocked |
| 10 | Allowed by exception | Allowed |

### Category Classification

Cloudflare classifies DNS queries into 194 content categories. The `categoryIds` field returns a comma-separated list (e.g., `"[8, 182]"`) which is parsed and mapped to human-readable names via `categoryList.js`.

## Limitations

- **30-day data retention**: Cloudflare's GraphQL API only returns data from the last 30 days
- **10,000 result limit**: Each GraphQL query is capped at 10,000 aggregated groups
- **No real-time streaming**: Data is polled on page load; no WebSocket updates
- **Category data for blocked queries**: Uses `gatewayResolverQueriesAdaptiveGroups` with `categoryIds` dimension (not `gatewayResolverByCategoryAdaptiveGroups` which doesn't return category data for blocked decisions)

## Project Structure

```
src/pages/cf-dns-dashboard/
├── index.html          # Main dashboard UI with Chart.js visualizations
└── categoryList.js     # Mapping of category IDs to human-readable names
```

## UI Theme Integration

The DNS dashboard seamlessly integrates with the existing theme system:

- **CSS Variables**: Uses the same color scheme as other pages
- **Light/Dark Mode**: Automatic theme detection with manual toggle
- **Responsive Design**: Works on desktop and mobile devices
- **Consistent Styling**: Matches the look and feel of cf-gateway and cf-access pages

## Troubleshooting

### No Data Displayed

**Check API Token Permissions:**
```bash
# Verify secrets are set
wrangler secret list
```

Should show:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` (if set as secret)

**Check Worker Logs:**
```bash
wrangler tail
```

Look for GraphQL errors or authentication issues.

### GraphQL Errors

**"cannot request data older than 30 days"**
- Cloudflare limits historical data to 30 days
- Use shorter time ranges (7d or 24h)

**"Unauthorized" or 401 errors**
- Verify API token has correct permissions
- Check token hasn't expired
- Ensure account ID is correct

### Empty Charts

**No DNS queries in time range:**
- Try a different time range
- Verify Gateway is actively filtering DNS queries
- Check that devices are using Cloudflare Gateway

## Security Considerations

- **API Token Security**: Tokens are stored as Wrangler secrets (never in code)
- **Access Control**: Protect the dashboard with Cloudflare Access
- **HTTPS Only**: Dashboard requires HTTPS for secure data transmission
- **Read-Only Access**: API token only has read permissions

## Protecting the Dashboard

It's highly recommended to protect the DNS dashboard with Cloudflare Access:

1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**
4. Set application domain: `dash.0security.net`
5. Set path: `/dns*`
6. Configure authentication policies
7. Save application

This ensures only authorized users can view DNS analytics.

## Performance

- **Caching**: Dashboard HTML is cached for 1 hour
- **API Responses**: Real-time data (no caching)
- **GraphQL Queries**: Limited to 10,000 results per query
- **Chart Rendering**: Client-side with Chart.js (lightweight)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Related Documentation

- [Main README](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Authentication flow details
- [Cloudflare GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)
- [Cloudflare Gateway Docs](https://developers.cloudflare.com/cloudflare-one/policies/filtering/dns-policies/)

## Original Source

This dashboard is based on [robdanz/cf-dns-dashboard](https://github.com/robdanz/cf-dns-dashboard) and has been adapted to:
- Use JavaScript instead of TypeScript
- Match the existing UI theme system
- Integrate with the existing worker architecture
- Share authentication and configuration with other pages
