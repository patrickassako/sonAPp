import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bimzik.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/dashboard", "/create", "/credits", "/settings", "/projects"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
