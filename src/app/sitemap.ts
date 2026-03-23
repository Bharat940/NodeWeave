import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://node-weave.vercel.app';
    
    // Core marketing or landing pages
    const routes = [
        '',
        '/workflows',
        '/templates',
        '/executions',
        '/credentials',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return [
        ...routes,
        // In a real app, you would fetch dynamic paths (like public templates) here
    ];
}
