import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/admin/', // If you have an admin dashboard
                '/settings/', // Private user info
                '/credentials/', // sensitive area
            ],
        },
        sitemap: 'https://node-weave.vercel.app/sitemap.xml',
    };
}
