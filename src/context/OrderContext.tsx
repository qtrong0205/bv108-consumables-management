import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IVatTuDuTru } from '@/data/mockData';
import { OrderRequest, Invoice, OrderHistory } from '@/types';
import { apiService, CreateOrderItemRequest, getStoredAuth } from '@/services/api';

interface OrderContextType {
    approvedOrders: OrderRequest[];
    addApprovedOrder: (item: IVatTuDuTru, duTruValue?: number) => Promise<void>;
    addApprovedOrdersBulk: (items: IVatTuDuTru[]) => Promise<void>;
    addManualOrder: (order: OrderRequest) => Promise<void>;
    placeOrders: (ids: number[]) => Promise<number>;
    invoices: Invoice[];
    addInvoices: (invoices: Invoice[]) => void;
    orderHistory: OrderHistory[];
    loadingOrders: boolean;
    refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const toForecastPayload = (item: IVatTuDuTru, duTruValue?: number): CreateOrderItemRequest => {
    const finalDuTru = duTruValue ?? item.duTru;
    const goiHang = Math.ceil(finalDuTru / item.slTrongQuyCach);

    return {
        nhaThau: item.nhaThau,
        maQuanLy: item.maQuanLy || '',
        maVtytCu: item.maVtytCu,
        tenVtytBv: item.tenVtytBv,
        maHieu: item.maHieu,
        hangSx: item.hangSx,
        donViTinh: item.donViTinh,
        quyCach: item.quyCach,
        dotGoiHang: goiHang,
        email: '',
    };
};

const toManualPayload = (order: OrderRequest): CreateOrderItemRequest => ({
    nhaThau: order.nhaThau,
    maQuanLy: order.maQuanLy,
    maVtytCu: order.maVtytCu,
    tenVtytBv: order.tenVtytBv,
    maHieu: order.maHieu,
    hangSx: order.hangSx,
    donViTinh: order.donViTinh,
    quyCach: order.quyCach,
    dotGoiHang: order.dotGoiHang,
    email: order.email,
});

export function OrderProvider({ children }: { children: ReactNode }) {
    const [approvedOrders, setApprovedOrders] = useState<OrderRequest[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const refreshOrders = async () => {
        const storedAuth = getStoredAuth();
        if (!storedAuth) {
            setApprovedOrders([]);
            setOrderHistory([]);
            return;
        }

        setLoadingOrders(true);
        try {
            const [pendingResponse, historyResponse] = await Promise.all([
                apiService.getPendingOrders(),
                apiService.getOrderHistory(),
            ]);

            setApprovedOrders(pendingResponse.data);
            setOrderHistory(historyResponse.data);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (!getStoredAuth()) {
            return;
        }

        void refreshOrders().catch(() => undefined);
    }, []);

    const addApprovedOrder = async (item: IVatTuDuTru, duTruValue?: number) => {
        await apiService.createForecastOrders({
            items: [toForecastPayload(item, duTruValue)],
        });

        await refreshOrders();
    };

    const addApprovedOrdersBulk = async (items: IVatTuDuTru[]) => {
        if (items.length === 0) {
            return;
        }

        await apiService.createForecastOrders({
            items: items.map((item) => toForecastPayload(item)),
        });

        await refreshOrders();
    };

    const addManualOrder = async (order: OrderRequest) => {
        await apiService.createManualOrder(toManualPayload(order));
        await refreshOrders();
    };

    const placeOrders = async (ids: number[]) => {
        const response = await apiService.placeOrders({ orderIds: ids });
        await refreshOrders();
        return response.placedCount;
    };

    const addInvoices = (newInvoices: Invoice[]) => {
        setInvoices((prev) => {
            const updated = [...prev];
            newInvoices.forEach((invoice) => {
                const existingIndex = updated.findIndex((item) => item.id === invoice.id);
                if (existingIndex >= 0) {
                    updated[existingIndex] = invoice;
                } else {
                    updated.push(invoice);
                }
            });
            return updated;
        });
    };

    return (
        <OrderContext.Provider
            value={{
                approvedOrders,
                addApprovedOrder,
                addApprovedOrdersBulk,
                addManualOrder,
                placeOrders,
                invoices,
                addInvoices,
                orderHistory,
                loadingOrders,
                refreshOrders,
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
