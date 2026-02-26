import { useState, useEffect } from 'react';
import { HoaDonUBot } from '@/types';

const API_BASE_URL = 'http://localhost:8080/api';

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

            const response = await fetch(`${API_BASE_URL}/hoa-don?limit=1000&offset=0`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.data) {
                setHoaDons(result.data);
            } else {
                setHoaDons([]);
            }
        } catch (err) {
            console.error('Lỗi khi fetch hóa đơn UBot:', err);
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
