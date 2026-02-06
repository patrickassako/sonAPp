import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Noto_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const notoSans = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-noto" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bimzik.com";

export const viewport: Viewport = {
    themeColor: "#121212",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: "BimZik - Créez votre chanson personnalisée avec l'IA",
        template: "%s | BimZik",
    },
    description:
        "Offrez une chanson unique au monde. Générez de la musique Afrobeats, Makossa, Amapiano, Coupé-Décalé et plus avec l'intelligence artificielle. Parfait pour la Saint-Valentin, mariages, anniversaires.",
    keywords: [
        "musique IA",
        "chanson personnalisée",
        "créer musique",
        "Afrobeats",
        "Makossa",
        "Amapiano",
        "Coupé-Décalé",
        "musique africaine",
        "cadeau musical",
        "chanson cadeau",
        "Saint-Valentin",
        "mariage chanson",
        "anniversaire chanson",
        "AI music generator",
        "BimZik",
        "musique Cameroun",
    ],
    authors: [{ name: "BimZik" }],
    creator: "BimZik",
    publisher: "BimZik",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    openGraph: {
        type: "website",
        locale: "fr_FR",
        alternateLocale: "en_US",
        url: SITE_URL,
        siteName: "BimZik",
        title: "BimZik - Créez votre chanson personnalisée avec l'IA",
        description:
            "Offrez une chanson unique au monde. Musique Afrobeats, Makossa, Amapiano et plus, générée par IA. Prête en 2 minutes.",
        images: [
            {
                url: "/images/og-bimzik.png",
                width: 1200,
                height: 630,
                alt: "BimZik - Créez votre musique avec l'IA",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "BimZik - Créez votre chanson personnalisée avec l'IA",
        description:
            "Offrez une chanson unique au monde. Musique Afrobeats, Makossa, Amapiano et plus, générée par IA.",
        images: ["/images/og-bimzik.png"],
        creator: "@bimzik",
    },
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.json",
    alternates: {
        canonical: SITE_URL,
    },
    category: "music",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className={`${spaceGrotesk.variable} ${notoSans.variable} ${inter.variable}`}>
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
                />
            </head>
            <body className="font-sans bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen">
                {children}
            </body>
        </html>
    );
}
