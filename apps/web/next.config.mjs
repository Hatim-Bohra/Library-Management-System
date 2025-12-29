/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    async rewrites() {
        console.log("[NextConfig] Env API_URL:", process.env.API_URL);
        console.log("[NextConfig] Env NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("[NextConfig] Env IS_DOCKER:", process.env.IS_DOCKER);

        // Local development fallback
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

        console.log("[NextConfig] Final Resolved apiUrl:", apiUrl);
        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/:path*`,
            },
            {
                source: '/uploads/:path*',
                destination: `${apiUrl}/uploads/:path*`,
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
            },
            {
                protocol: 'http',
                hostname: 'api',
            },
            {
                protocol: 'http',
                hostname: 'lms_api',
            },
            {
                protocol: 'http',
                hostname: 'covers.openlibrary.org',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'images-na.ssl-images-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'm.media-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'images.gr-assets.com',
            },
            {
                protocol: 'https',
                hostname: 'i.gr-assets.com',
            },
            {
                protocol: 'https',
                hostname: 'www.goodreads.com',
            },
            {
                protocol: 'https',
                hostname: 'covers.openlibrary.org',
            },
        ],
    },
};

export default nextConfig;
