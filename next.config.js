/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Для GitHub Pages
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/latechnique' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/latechnique/' : '',
  
  images: {
    unoptimized: true, // GitHub Pages не поддерживает Next.js Image Optimization
  },
  
  // Отключаем trailing slash для корректной работы на GitHub Pages
  trailingSlash: true,
};

module.exports = nextConfig;
