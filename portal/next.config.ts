import type { NextConfig } from 'next';
import { join } from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@hry/shared'],
  outputFileTracingRoot: join(__dirname, '..'),
};

export default nextConfig;
