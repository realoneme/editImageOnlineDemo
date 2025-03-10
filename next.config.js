/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // This is to handle React Konva which requires browser-specific features
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  // This ensures that server-side rendering is disabled for components that use window
  reactStrictMode: true,
};

module.exports = nextConfig;
