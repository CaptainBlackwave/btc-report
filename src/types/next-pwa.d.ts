declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    fallback?: string | false;
    cache?: {
      images?: boolean;
      audio?: boolean;
      videos?: boolean;
      fonts?: boolean;
      scripts?: boolean;
      styles?: boolean;
    };
    publicExcludes?: string[];
    buildExcludes?: string[];
    reload?: boolean;
    activeOnFront?: boolean;
    hotReload?: boolean;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
