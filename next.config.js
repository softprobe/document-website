/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'webresource.c-ctrip.com',
      port: '',
    }]
  }
}

export default nextConfig
