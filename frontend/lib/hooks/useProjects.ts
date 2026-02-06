import useSWR from 'swr';
import { api } from '@/lib/api/client';
import { supabase } from '@/lib/auth/supabase';

export interface Project {
    id: string;
    user_id: string;
    title: string;
    style_id: string;
    style_name?: string;
    mode: 'TEXT' | 'CONTEXT';
    language: string;
    lyrics?: string;
    context?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    audio_url?: string;
    duration?: number;
    created_at: string;
    updated_at: string;
}

async function fetchProjects(): Promise<Project[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        return [];
    }

    return api.getProjects(session.access_token) as Promise<Project[]>;
}

export function useProjects() {
    const { data, error, isLoading, mutate } = useSWR<Project[]>(
        '/api/v1/projects',
        () => fetchProjects(),
        {
            // Only poll when projects are actively processing, otherwise stop
            refreshInterval: (latestData) => {
                const hasProcessing = latestData?.some(
                    (p) => p.status === 'processing' || p.status === 'pending'
                );
                return hasProcessing ? 5000 : 0;
            },
            revalidateOnFocus: true,
            dedupingInterval: 10000,
        }
    );

    return {
        projects: data || [],
        isLoading,
        error,
        refetch: mutate,
    };
}
