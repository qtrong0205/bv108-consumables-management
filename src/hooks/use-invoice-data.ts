import { useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { mockInvoices } from '@/data/mockInvoices';

/**
 * Hook để load dữ liệu hóa đơn từ uBot
 * Trong production sẽ gọi API hoặc WebSocket
 */
export function useInvoiceData() {
    const { addInvoices } = useOrder();

    useEffect(() => {
        // Load mock data khi mount
        // Trong production: gọi API hoặc setup WebSocket
        addInvoices(mockInvoices);
    }, []);
}
