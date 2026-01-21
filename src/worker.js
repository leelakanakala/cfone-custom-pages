// Cloudflare Worker for Custom Pages
// Serves multiple custom pages based on URL path

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to appropriate page handler
    if (path === '/gateway/' || path === '/gateway') {
      return serveBlockPage(url);
    } else if (path === '/coaching/' || path === '/coaching') {
      return serveCoachingPage(url);
    } else if (path === '/') {
      // Redirect root to gateway for now
      return Response.redirect(url.origin + '/gateway/', 302);
    } else {
      return new Response('Page not found', { status: 404 });
    }
  },
};

// Import page templates
import blockPageHTML from './pages/block/index.html';
import coachingPageHTML from './pages/coaching/index.html';

// Serve Block Page
function serveBlockPage(url) {
  // Read the block page HTML from the imported file
  // For now, we'll inline it until we set up proper bundling
  const blockPageHTML = getBlockPageHTML();
  
  return new Response(blockPageHTML, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

// Serve Coaching Page
function serveCoachingPage(url) {
  const coachingPageHTML = getCoachingPageHTML();
  
  return new Response(coachingPageHTML, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

// Get Block Page HTML (placeholder - will be replaced with actual content)
function getBlockPageHTML() {
  // This will be the full HTML from src/pages/block/index.html
  // For now, return a placeholder
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Block Page</title>
</head>
<body>
    <h1>Block Page - To be implemented</h1>
    <p>This will load from src/pages/block/index.html</p>
</body>
</html>`;
}

// Get Coaching Page HTML (placeholder)
function getCoachingPageHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coaching Page</title>
</head>
<body>
    <h1>Coaching Page - To be implemented</h1>
    <p>This will load from src/pages/coaching/index.html</p>
</body>
</html>`;
}
