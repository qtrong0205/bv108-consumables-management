import { useState, useEffect } from 'react';
import { HoaDonUBot } from '@/types';
import { apiService } from '@/services/api';

interface UseHoaDonUBotResult {
    hoaDons: HoaDonUBot[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useHoaDonUBot(): UseHoaDonUBotResult {
    const [hoaDons, setHoaDons] = useState<HoaDonUBot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHoaDons = async () => {
        try {
            setLoading(true);
            setError(null);

            const pageSize = 1000;
            const firstResponse = await apiService.getHoaDons(pageSize, 0);
            const firstPage = firstResponse.data || [];
            const total = Math.max(firstResponse.total || 0, firstPage.length);

            if (total <= firstPage.length || firstPage.length === 0) {
                setHoaDons(firstPage);
                return;
            }

            const allRows = [...firstPage];
            for (let offset = firstPage.length; offset < total; offset += pageSize) {
                const nextResponse = await apiService.getHoaDons(pageSize, offset);
                const nextPage = nextResponse.data || [];
                if (nextPage.length === 0) {
                    break;
                }

                allRows.push(...nextPage);

                if (nextPage.length < pageSize) {
                    break;
                }
            }

            setHoaDons(allRows);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi không xác định');
            setHoaDons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHoaDons();
    }, []);

    return {
        hoaDons,
        loading,
        error,
        refetch: fetchHoaDons,
    };
}
