import { Metadata } from "next";
import SharePlayerClient from "./SharePlayerClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bimzik.com";

interface SharePageProps {
    params: Promise<{ id: string }>;
}

async function fetchSharedProject(id: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/share/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
    const { id } = await params;
    const project = await fetchSharedProject(id);

    if (!project) {
        return {
            title: "Track Not Found - BimZik",
        };
    }

    const title = `${project.title} - BimZik`;
    const description = `Listen to "${project.title}" - AI generated music on BimZik`;
    const coverImage = project.audio_files?.[0]?.image_url || null;
    const pageUrl = `${SITE_URL}/share/${id}`;
    const audioUrl = project.audio_files?.[0]?.file_url || null;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: pageUrl,
            type: "music.song",
            ...(coverImage && {
                images: [
                    {
                        url: coverImage,
                        width: 1200,
                        height: 630,
                        alt: project.title,
                    },
                ],
            }),
            ...(audioUrl && {
                audio: [{ url: audioUrl }],
            }),
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            ...(coverImage && { images: [coverImage] }),
        },
    };
}

export default async function SharePage({ params }: SharePageProps) {
    const { id } = await params;
    return <SharePlayerClient projectId={id} />;
}
