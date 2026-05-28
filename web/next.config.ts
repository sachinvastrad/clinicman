import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Tell Next.js to trace the workspace root from this folder (silences the
  // "multiple lockfiles detected" warning when building inside Electron).
  outputFileTracingRoot: path.join(__dirname),
  // Make sure Prisma's native engine + generated client are copied into the
  // standalone build so the packaged Electron app can run database queries.
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "127.0.0.1"] },
  },
};

export default nextConfig;
