import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inscription",
    description: "Créez votre compte BimZik et commencez à générer votre musique personnalisée avec l'IA. Afrobeats, Makossa, Amapiano et plus.",
    openGraph: {
        title: "Inscription - BimZik",
        description: "Créez votre compte et générez votre première chanson personnalisée avec l'IA.",
    },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return children;
}
