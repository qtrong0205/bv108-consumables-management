import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IVatTuDuTru } from '@/data/mockData';
import { OrderRequest } from '@/types';

interface OrderContextType {
    // Danh sách vật tư đã duyệt chờ gọi hàng (dưới dạng OrderRequest)
    approvedOrders: OrderRequest[];
    // Thêm một vật tư đã duyệt
    addApprovedOrder: (item: IVatTuDuTru, duTruValue?: number) => void;
    // Thêm nhiều vật tư đã duyệt (duyệt tất cả)
    addApprovedOrdersBulk: (items: IVatTuDuTru[]) => void;
    // Xóa vật tư khỏi danh sách (khi đã gọi hàng xong)
    removeOrders: (ids: number[]) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    const [approvedOrders, setApprovedOrders] = useState<OrderRequest[]>([]);

    // Chuyển đổi IVatTuDuTru sang OrderRequest
    const convertToOrderRequest = (item: IVatTuDuTru, duTruValue?: number): OrderRequest => {
        const finalDuTru = duTruValue ?? item.duTru;
        const goiHang = Math.ceil(finalDuTru / item.slTrongQuyCach);

        return {
            id: Date.now() + item.stt, // Unique ID
            nhaThau: item.nhaThau,
            maQuanLy: item.maQuanLy || '',
            maVtytCu: item.maVtytCu,
            tenVtytBv: item.tenVtytBv,
            maHieu: item.maHieu,
            hangSx: item.hangSx,
            donViTinh: item.donViTinh,
            quyCach: item.quyCach,
            dotGoiHang: goiHang,
        };
    };

    // Thêm một vật tư đã duyệt
    const addApprovedOrder = (item: IVatTuDuTru, duTruValue?: number) => {
        const newOrder = convertToOrderRequest(item, duTruValue);

        setApprovedOrders(prev => {
            // Kiểm tra xem vật tư đã có trong danh sách chưa (theo maVtytCu)
            const existingIndex = prev.findIndex(order => order.maVtytCu === item.maVtytCu);
            if (existingIndex >= 0) {
                // Cập nhật số lượng gọi hàng
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    dotGoiHang: updated[existingIndex].dotGoiHang + newOrder.dotGoiHang
                };
                return updated;
            }
            // Thêm mới
            return [newOrder, ...prev];
        });
    };

    // Thêm nhiều vật tư đã duyệt (duyệt tất cả)
    const addApprovedOrdersBulk = (items: IVatTuDuTru[]) => {
        const newOrders = items.map((item, index) => ({
            ...convertToOrderRequest(item),
            id: Date.now() + index + item.stt,
        }));

        setApprovedOrders(prev => {
            const updated = [...prev];
            newOrders.forEach(newOrder => {
                const existingIndex = updated.findIndex(order => order.maVtytCu === newOrder.maVtytCu);
                if (existingIndex >= 0) {
                    // Cộng dồn số lượng
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        dotGoiHang: updated[existingIndex].dotGoiHang + newOrder.dotGoiHang
                    };
                } else {
                    updated.unshift(newOrder);
                }
            });
            return updated;
        });
    };

    // Xóa vật tư khỏi danh sách (khi đã gọi hàng xong)
    const removeOrders = (ids: number[]) => {
        setApprovedOrders(prev => prev.filter(order => !ids.includes(order.id)));
    };

    return (
        <OrderContext.Provider
            value={{
                approvedOrders,
                addApprovedOrder,
                addApprovedOrdersBulk,
                removeOrders,
            }}
        >
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}
