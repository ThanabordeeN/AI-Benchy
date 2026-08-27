/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  reactStrictMode: true,
  output: isStaticExport ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
