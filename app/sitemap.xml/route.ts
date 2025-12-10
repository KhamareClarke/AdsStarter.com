export async function GET() {
  const baseUrl = 'https://adsstarter.com'; // Change to your production URL
  const pages = [
    '/',
    '/showcase',
    '/sitemap',
    // Add more static or dynamic routes here as needed
  ];

  const urls = pages.map(
    (path) => `  <url>\n    <loc>${baseUrl}${path}</loc>\n  </url>`
  ).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
