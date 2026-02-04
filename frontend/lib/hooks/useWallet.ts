import useSWR from 'swr';
import { api } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';

async function fetchWallet() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        return { credits: 0 };
    }

    return api.getWallet(session.access_token);
}

export function useWallet() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/v1/users/wallet',
        fetchWallet,
        {
            revalidateOnFocus: true,
            dedupingInterval: 30000,
        }
    );

    return {
        credits: data?.credits || 0,
        isLoading,
        error,
        refetch: mutate,
    };
}
