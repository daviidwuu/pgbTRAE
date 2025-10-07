
import type {NextConfig} from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  // register: true, // We are now handling registration manually
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'sw.js',
  swSrc: 'src/sw.js',
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
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withPWA(nextConfig);
