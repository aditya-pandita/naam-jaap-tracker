import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Firebase Auth popup (signInWithPopup) requires relaxed Cross-Origin-Opener-Policy.
   * Next.js 14+ sets COOP to "same-origin" by default, which prevents the Google
   * OAuth popup from communicating credentials back to the parent window.
   *
   * Fix: "same-origin-allow-popups" allows the popup while still protecting
   * against other cross-origin attacks.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;