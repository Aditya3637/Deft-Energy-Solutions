/**
 * Environment-aware build target.
 * - GitHub Pages (default): static export under /Deft-Energy-Solutions.
 * - Vercel (sets process.env.VERCEL): SSR/server-components at the root, so the
 *   app can fetch live data per request once the backend reaches data parity.
 * @type {import('next').NextConfig}
 */
const repo = "Deft-Energy-Solutions";
const isProd = process.env.NODE_ENV === "production";
const onVercel = !!process.env.VERCEL;
const pagesBuild = isProd && !onVercel;

const nextConfig = {
  // No static export on Vercel — render server components at request time there.
  output: onVercel ? undefined : "export",
  basePath: pagesBuild ? `/${repo}` : "",
  assetPrefix: pagesBuild ? `/${repo}/` : "",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // No ESLint config in the repo yet; don't block the deploy build on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
