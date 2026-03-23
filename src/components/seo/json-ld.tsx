import React from 'react';

export const JsonLd = () => {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "NodeWeave",
        "url": "https://node-weave.vercel.app",
        "logo": "https://node-weave.vercel.app/logos/logo.svg",
        "sameAs": [
            "https://twitter.com/nodeweave",
            "https://github.com/nodeweave"
        ]
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "NodeWeave",
        "url": "https://node-weave.vercel.app",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://node-weave.vercel.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
        </>
    );
};
