/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/latechnique' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/latechnique/' : '',
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ['three', 'gsap'],
};

module.exports = nextConfig;
