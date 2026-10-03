import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://db.onlinewebfonts.com;
  img-src 'self' data: blob: https://img.clerk.com https://*.tile.openstreetmap.org https://demotiles.maplibre.org https://images.unsplash.com;
  font-src 'self' data: https://fonts.gstatic.com https://db.onlinewebfonts.com;
  media-src 'self' https://d8j0ntlcm91z4.cloudfront.net blob: data:;
  connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.com https://demotiles.maplibre.org https://*.tile.openstreetmap.org https://*.tiles.mapbox.com https://events.mapbox.com https://db.onlinewebfonts.com;
  worker-src 'self' blob:;
  frame-ancestors 'none';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
