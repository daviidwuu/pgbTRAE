
import type {NextConfig} from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  // register: true, // We are now handling registration manually
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'sw.js',
  swSrc: 'public/sw.js',
  scope: '/',
  // Exclude large files and development assets from precaching
  exclude: [
    /\.map$/,
    /manifest$/,
    /\.DS_Store$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
    /\.js\.map$/,
    /\.css\.map$/,
    /^build-manifest\.json$/,
  ],
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
