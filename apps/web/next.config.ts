import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // packages/shared는 빌드하지 않은 TS 소스를 그대로 내보낸다
  transpilePackages: ['@space-log/shared'],
};

export default nextConfig;
