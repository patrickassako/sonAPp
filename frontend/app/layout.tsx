import type { Metadata } from "next";
import { Inter, Space_Grotesk, Noto_Sans } from "next/font/google"; // Import new fonts
import "./globals.css";

// Configure fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const notoSans = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-noto" });

export const metadata: Metadata = {
    title: "MusicApp - Créez de la musique africaine avec l'IA",
    description: "Générez de la musique Makossa, Coupé-Décalé, Amapiano, Afrobeats et plus avec l'intelligence artificielle",
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
