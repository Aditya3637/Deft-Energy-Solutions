/**
 * Static export for GitHub Pages.
 * The repo is served from https://<user>.github.io/Deft-Energy-Solutions/, so we
 * apply a basePath/assetPrefix in production builds. Local `next dev` stays at root.
 * @type {import('next').NextConfig}
 */
const repo = "Deft-Energy-Solutions";
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // No ESLint config in the repo yet; don't block the deploy build on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
