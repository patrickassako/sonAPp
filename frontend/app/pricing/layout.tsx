import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tarifs",
    description: "Découvrez les tarifs BimZik. Créez une chanson personnalisée à partir de 5 crédits. Paiement par Mobile Money (MTN, Orange) ou carte bancaire.",
    openGraph: {
        title: "Tarifs - BimZik",
        description: "Créez une chanson personnalisée à partir de 5 crédits. Paiement Mobile Money ou carte bancaire.",
    },
    keywords: [
        "tarifs BimZik",
        "prix musique IA",
        "Mobile Money musique",
        "crédits BimZik",
        "chanson personnalisée prix",
    ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
