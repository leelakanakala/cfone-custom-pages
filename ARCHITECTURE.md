# Architecture

## Overview

This project is a Cloudflare Worker that serves multiple custom pages for Zero Trust. All pages are bundled into a single worker (`main.js`) via the build script.

## Components

### Gateway Block Page (`/cf-gateway/`)
Static HTML page served when Cloudflare Gateway blocks a request. Cloudflare SWG appends query parameters (`cf_site_uri`, `cf_policy_name`, `cf_request_category_names`, etc.) which the page parses and displays to the user.

### Access Info Page (`/cf-access/`)
Dynamic page that displays authenticated user information. Uses Cloudflare Access JWT for authentication and fetches device/posture data via Cloudflare API.

### DNS Analytics Dashboard (`/cf-dns-dashboard/`)
Real-time DNS analytics dashboard. Fetches data from Cloudflare's GraphQL Analytics API (`gatewayResolverQueriesAdaptiveGroups`) and renders charts using Chart.js. Supports Live mode with 10-second auto-refresh.

## Authentication Flow (cf-access)

### Initial Authentication
```
User → Protected Resource (e.g., intranet.example.com)
  ↓
Cloudflare Access validates/redirects to login
  ↓
User authenticates → Cloudflare sets cookies:
  - CF_Authorization (HttpOnly, Secure, Domain=.example.com)
  ↓
Redirect to original resource with valid session
```

### Accessing cf-access Page
```
User → access.example.com/cf-access
  ↓
Browser sends CF_Authorization cookie (wildcard domain)
  ↓
Cloudflare adds Cf-Access-Jwt-Assertion header
  ↓
Worker serves page → JavaScript fetches data
  ↓
No re-authentication needed ✓
```

## Key Components

### Cookies

**CF_Authorization**
- JWT token (HttpOnly, Secure)
- Domain: `.example.com` (wildcard - works across all subdomains)
- Automatically sent by browser for same-domain requests

### Headers

**Cf-Access-Jwt-Assertion**
- Added by Cloudflare Access automatically
- Contains user identity claims (email, groups, device_id)
- Used by worker for server-side authentication

### API Endpoints

#### `/cf-access/api/userdetails` (Worker API)
- Combines identity, device details, and posture data
- Validates `Cf-Access-Jwt-Assertion` header
- Fetches from `/cdn-cgi/access/get-identity` and Cloudflare API

#### `/dns/api/*` (DNS Dashboard APIs)
- `monthly-stats` - Total queries, allowed/blocked counts
- `30day` - Query trends over time
- `top-allowed`, `top-blocked` - Category breakdowns
- `top-queries`, `blocked-domains` - Domain analysis
- `live-logs` - Real-time DNS query logs
- `geography`, `geography-blocked` - Country distribution

## Worker Implementation

### Route Handling
```javascript
if (path === '/cf-access/api/userdetails') {
  return handleUserDetails(request, env);
} else if (path.startsWith('/dns/api/')) {
  return handleDNSAPI(request, env);
}
```

### Key Functions

**handleUserDetails(request, env)**
- Extracts device_id from JWT
- Fetches identity, device details, posture data
- Returns unified JSON response

**handleLiveLogs(request, env)**
- Queries GraphQL for recent DNS logs
- Groups by queryName, categoryIds, resolverDecision, datetimeMinute
- Returns aggregated log entries

### Why Use Worker Proxy?

1. **Cookie forwarding** - Browser cookies need explicit forwarding
2. **API aggregation** - Combines multiple API calls
3. **Token security** - Keeps Bearer/API tokens server-side
4. **Error handling** - Centralized error management

## References

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)
