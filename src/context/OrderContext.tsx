import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { IVatTuDuTru } from '@/data/mockData';
import { OrderRequest, Invoice, OrderHistory } from '@/types';
import { apiService, CreateOrderItemRequest, getStoredAuth } from '@/services/api';

interface OrderContextType {
    approvedOrders: OrderRequest[];
    unreadOrderIds: number[];
    unreadOrderCount: number;
    hasSupplierNotification: boolean;
    clearSupplierNotification: () => void;
    markOrdersAsRead: (ids: number[]) => void;
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
    const [unreadOrderIds, setUnreadOrderIds] = useState<number[]>([]);
    const [hasSupplierNotification, setHasSupplierNotification] = useState(false);
    const [seenOrderIds, setSeenOrderIds] = useState<number[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const hasInitializedPendingOrdersRef = useRef(false);
    const previousPendingIdSetRef = useRef<Set<number>>(new Set());
    const seenStorageKeyRef = useRef<string | null>(null);

    const buildSeenStorageKey = () => {
        const auth = getStoredAuth();
        if (!auth) return null;
        return `bv108_seen_pending_orders_${auth.user.id}`;
    };

    const persistSeenOrderIds = (ids: number[]) => {
        const key = seenStorageKeyRef.current;
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(ids));
    };

    const refreshOrders = async () => {
        const storedAuth = getStoredAuth();
        if (!storedAuth) {
            setApprovedOrders([]);
            setUnreadOrderIds([]);
            setHasSupplierNotification(false);
            setSeenOrderIds([]);
            setOrderHistory([]);
            hasInitializedPendingOrdersRef.current = false;
            previousPendingIdSetRef.current = new Set();
            seenStorageKeyRef.current = null;
            return;
        }

        const nextSeenStorageKey = `bv108_seen_pending_orders_${storedAuth.user.id}`;
        if (seenStorageKeyRef.current !== nextSeenStorageKey) {
            seenStorageKeyRef.current = nextSeenStorageKey;
            const rawSeen = localStorage.getItem(nextSeenStorageKey);
            if (rawSeen) {
                try {
                    const parsed = JSON.parse(rawSeen) as number[];
                    const normalized = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
                    setSeenOrderIds(normalized);
                } catch {
                    setSeenOrderIds([]);
                }
            } else {
                setSeenOrderIds([]);
            }
        }

        setLoadingOrders(true);
        try {
            const [pendingResponse, historyResponse] = await Promise.all([
                apiService.getPendingOrders(),
                apiService.getOrderHistory(),
            ]);

            const pendingOrders = pendingResponse.data;
            const previousPendingIdSet = previousPendingIdSetRef.current;
            const pendingIdSet = new Set(pendingOrders.map((order) => order.id));
            const pendingForecastIds = pendingOrders
                .filter((order) => order.source !== 'manual')
                .map((order) => order.id);

            setApprovedOrders(pendingOrders);
            setSeenOrderIds((prevSeen) => {
                const normalizedSeen = prevSeen.filter((id) => pendingIdSet.has(id));

                if (hasInitializedPendingOrdersRef.current) {
                    const hasNewForecastOrder = pendingOrders.some(
                        (order) => order.source !== 'manual' && !previousPendingIdSet.has(order.id)
                    );
                    if (hasNewForecastOrder) {
                        setHasSupplierNotification(true);
                    }
                }

                setUnreadOrderIds(pendingForecastIds.filter((id) => !normalizedSeen.includes(id)));
                persistSeenOrderIds(normalizedSeen);
                return normalizedSeen;
            });
            setOrderHistory(historyResponse.data);
            hasInitializedPendingOrdersRef.current = true;
            previousPendingIdSetRef.current = pendingIdSet;
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

    const markOrdersAsRead = (ids: number[]) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        setUnreadOrderIds((prev) => prev.filter((id) => !idSet.has(id)));
        setSeenOrderIds((prev) => {
            const updated = [...new Set([...prev, ...ids])];
            persistSeenOrderIds(updated);
            return updated;
        });
    };

    const unreadOrderCount = unreadOrderIds.length;

    const clearSupplierNotification = () => {
        setHasSupplierNotification(false);
    };

    return (
        <OrderContext.Provider
            value={{
                approvedOrders,
                unreadOrderIds,
                unreadOrderCount,
                hasSupplierNotification,
                clearSupplierNotification,
                markOrdersAsRead,
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
