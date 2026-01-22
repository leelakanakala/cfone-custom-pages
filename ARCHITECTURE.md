# Cloudflare Access Architecture

## Overview

The `/cf-access` page displays user identity, device information, and security posture for authenticated users. It leverages Cloudflare Access authentication and APIs without requiring separate login.

## Authentication Flow

### Initial Authentication
```
User → Protected Resource (e.g., intranet.example.com)
  ↓
Cloudflare Access validates/redirects to login
  ↓
User authenticates → Cloudflare sets cookies:
  - CF_Authorization (HttpOnly, Secure, Domain=.example.com)
  - CF-Access-Authenticated-User-Email
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
- Purpose: Primary authentication token
- Automatically sent by browser for same-domain requests

### Headers

**Cf-Access-Jwt-Assertion**
- Added by Cloudflare Access automatically
- Contains user identity claims (email, groups, device_id)
- Used by worker for server-side authentication

### API Endpoints

#### `/cf-access/api/userdetails` (Worker API)
- **Purpose**: Combines identity, device details, and posture data
- **Authentication**: Validates `Cf-Access-Jwt-Assertion` header
- **Flow**:
  1. Extract `device_id` from JWT token
  2. Fetch identity from `/cdn-cgi/access/get-identity`
  3. Fetch device details from Cloudflare API (if Bearer token configured)
  4. Fetch posture data from Cloudflare API (if Bearer token configured)
- **Response**: Combined JSON with identity, device, and posture objects
- **Environment Variables**: `BEARER_TOKEN` (optional, for API calls)

#### `/cdn-cgi/access/get-identity` (Cloudflare Managed)
- Returns authenticated user's identity information
- Requires valid CF_Authorization cookie or JWT assertion
- Includes: user email/name, groups, device sessions, WARP status

#### Cloudflare API Endpoints
- `GET /accounts/{account_id}/devices/{device_id}` - Device details
- `GET /accounts/{account_id}/devices/{device_id}/posture/check` - Posture checks
- Requires Bearer token with Zero Trust read permissions

### JavaScript Files

**warpinfo.js**
- Processes user information from identity data
- Fetches WARP status from `cloudflare.com/cdn-cgi/trace`
- Extracts user groups (handles both string and object arrays)

**deviceinfo.js**
- Processes device information
- Prioritizes API data over identity data
- Falls back to identity data if API unavailable

**postureinfo.js**
- Processes device posture check results
- Searches for Crowdstrike and OS version checks
- Defaults to `true` if checks not found

## Worker Implementation

### Route Handling
```javascript
if (path === '/cf-access/api/userdetails') {
  return handleUserDetails(request, env);
}
```

### Key Functions

**getDeviceIdFromToken(jwt)**
- Extracts device_id from JWT payload
- Returns device ID or null

**fetchDeviceDetails(account_id, device_id, bearerToken)**
- Fetches device info from Cloudflare API
- Returns device details or error object

**fetchDevicePosture(account_id, device_id, bearerToken)**
- Fetches posture checks from Cloudflare API
- Returns posture results or error object

**handleUserDetails(request, env)**
- Combines identity, device, and posture data
- Returns unified JSON response

### Why Use Worker Proxy?

1. **Cookie forwarding** - Browser cookies need explicit forwarding
2. **API aggregation** - Combines multiple API calls
3. **Token security** - Keeps Bearer token server-side
4. **Error handling** - Centralized error management
5. **Consistent responses** - Unified JSON format

## Cookie Domain Configuration

### Wildcard Domain (`.example.com`)
- Cookie available on ALL subdomains
- Enables SSO across `*.example.com`
- User authenticates once, accesses all subdomains

### Cookie Attributes
```
Domain=.example.com  → Works across all subdomains
Path=/               → Available on all paths
HttpOnly             → Prevents JavaScript access (XSS protection)
Secure               → HTTPS only
SameSite=Lax         → Allows top-level navigation
```

## Security Considerations

- **HttpOnly flag** prevents XSS attacks
- **Secure flag** ensures HTTPS transmission
- **Token validation** on every request by Cloudflare
- **Bearer token** stored server-side only
- **No double authentication** via domain-wide cookie

## Troubleshooting

**Cookie Not Sent (401 errors)**
- Check cookie domain is `.example.com` (with leading dot)
- Verify cookie hasn't expired
- Ensure HTTPS is used

**JWT Assertion Missing**
- Ensure route is behind Cloudflare Access
- Verify Access is properly configured

**Device/Posture Data Empty**
- Check `BEARER_TOKEN` is configured
- Verify Bearer token has Zero Trust read permissions
- Check `account_id` exists in identity data

## Configuration Checklist

- [ ] Cloudflare Access application configured
- [ ] Cookie domain set to `.example.com` (wildcard)
- [ ] Access policy configured
- [ ] Worker routes in `wrangler.jsonc`
- [ ] Worker deployed
- [ ] DNS proxied through Cloudflare
- [ ] SSL/TLS enabled (Full or Full Strict)
- [ ] Bearer token configured (optional, for device/posture data)

## Related Files

- `/src/worker-template.js` - Worker routing and API handlers
- `/src/pages/cf-access/index.html` - Main page UI
- `/src/pages/cf-access/scripts/*.js` - Data fetching scripts
- `/wrangler.jsonc` - Worker configuration
- `/src/build.js` - Build script

## References

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Access JWT Validation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)
