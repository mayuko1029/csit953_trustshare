/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for faster development - fixes workspace root warning
  outputFileTracingRoot: __dirname,
  
  // Optimize images for faster loading
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig