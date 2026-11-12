import type { NextConfig } from "next";

// Where the Express backend lives: http://localhost:4000 locally, the backend's
// Vercel URL in production. Fails at startup with the variable's name, instead
// of failing later on the first API call.
function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error(
      "BACKEND_URL is not set. Add it to frontend/.env.local (http://localhost:4000 locally).",
    );
  }
  return url.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The browser only ever talks to this site. /api/* is passed on to the
  // backend with the path unchanged, so the session cookie is a same-site
  // cookie even though the backend runs on another domain (J10).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl()}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
