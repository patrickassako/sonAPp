import useSWR from 'swr';
import { api } from '@/lib/api/client';
import { supabase } from '@/lib/auth/supabase';

async function fetchWallet() {
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
        }
    );

    return {
        credits: data?.credits || 0,
        isLoading,
        error,
        refetch: mutate,
    };
}
