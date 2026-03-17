import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { IVatTuDuTru } from '@/data/mockData';
import { OrderRequest, Invoice, OrderHistory } from '@/types';
import { apiService, CreateOrderItemRequest, getStoredAuth, OrderUnreadSnapshot } from '@/services/api';

interface OrderContextType {
    approvedOrders: OrderRequest[];
    unreadGroupKeys: string[];
    hasSupplierNotification: boolean;
    clearSupplierNotification: () => void;
    markGroupsAsRead: (groupKeys: string[]) => void;
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const RED_DOT_STORAGE_PREFIX = 'bv108_supplier_red_dot_';

const buildWebsocketUrl = (token: string) => {
    const wsBase = API_BASE_URL.replace(/^http/i, 'ws');
    return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
};

const uniqueStrings = (values: string[]) => [...new Set(values.filter((value) => value && value.trim().length > 0))];

export function OrderProvider({ children }: { children: ReactNode }) {
    const [approvedOrders, setApprovedOrders] = useState<OrderRequest[]>([]);
    const [unreadGroupKeys, setUnreadGroupKeys] = useState<string[]>([]);
    const [hasSupplierNotification, setHasSupplierNotification] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const isRefreshingOrdersRef = useRef(false);
    const pendingRefreshOrdersRef = useRef(false);
    const wsRef = useRef<WebSocket | null>(null);
    const wsReconnectTimeoutRef = useRef<number | null>(null);

    const getRedDotStorageKey = () => {
        const auth = getStoredAuth();
        if (!auth) return null;
        return `${RED_DOT_STORAGE_PREFIX}${auth.user.id}`;
    };

    const persistRedDotState = (value: boolean) => {
        const key = getRedDotStorageKey();
        if (!key) return;
        localStorage.setItem(key, value ? '1' : '0');
    };

    const applyUnreadSnapshot = (snapshot: OrderUnreadSnapshot) => {
        setHasSupplierNotification((prev) => {
            const next = snapshot.hasSupplierRedDot ? true : prev;
            persistRedDotState(next);
            return next;
        });
        setUnreadGroupKeys(uniqueStrings(snapshot.unreadGroupKeys || []));
    };

    const refreshOrders = async () => {
        if (isRefreshingOrdersRef.current) {
            pendingRefreshOrdersRef.current = true;
            return;
        }

        const storedAuth = getStoredAuth();
        if (!storedAuth) {
            setApprovedOrders([]);
            setUnreadGroupKeys([]);
            setHasSupplierNotification(false);
            persistRedDotState(false);
            setOrderHistory([]);
            return;
        }

        isRefreshingOrdersRef.current = true;
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
            isRefreshingOrdersRef.current = false;

            if (pendingRefreshOrdersRef.current) {
                pendingRefreshOrdersRef.current = false;
                void refreshOrders();
            }
        }
    };

    const fetchUnreadSnapshot = async () => {
        const storedAuth = getStoredAuth();
        if (!storedAuth) {
            setHasSupplierNotification(false);
            setUnreadGroupKeys([]);
            return;
        }

        const response = await apiService.getOrderUnreadSnapshot();
        applyUnreadSnapshot(response.data);
    };

    const connectWebSocket = () => {
        const storedAuth = getStoredAuth();
        if (!storedAuth) {
            return;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const ws = new WebSocket(buildWebsocketUrl(storedAuth.token));
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as {
                    type?: string;
                    payload?: OrderUnreadSnapshot | { groupKeys?: string[]; createdAt?: string };
                };

                if (data.type === 'orders.new_pending') {
                    const payload = data.payload as { groupKeys?: string[] };
                    setHasSupplierNotification(true);
                    persistRedDotState(true);
                    setUnreadGroupKeys((prev) => uniqueStrings([...prev, ...(payload.groupKeys || [])]));
                    void refreshOrders();
                    return;
                }

                if (data.type === 'orders.unread_updated' || data.type === 'orders.unread_snapshot') {
                    applyUnreadSnapshot(data.payload as OrderUnreadSnapshot);
                }
            } catch {
                // Ignore malformed realtime event payload.
            }
        };

        ws.onclose = () => {
            wsRef.current = null;
            if (!getStoredAuth()) return;
            if (wsReconnectTimeoutRef.current) {
                window.clearTimeout(wsReconnectTimeoutRef.current);
            }
            wsReconnectTimeoutRef.current = window.setTimeout(() => {
                connectWebSocket();
            }, 3000);
        };
    };

    useEffect(() => {
        if (!getStoredAuth()) {
            return;
        }

        const storageKey = getRedDotStorageKey();
        if (storageKey) {
            setHasSupplierNotification(localStorage.getItem(storageKey) === '1');
        }

        void refreshOrders().catch(() => undefined);
        void fetchUnreadSnapshot().catch(() => undefined);
        connectWebSocket();

        return () => {
            if (wsReconnectTimeoutRef.current) {
                window.clearTimeout(wsReconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
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

    const markGroupsAsRead = (groupKeys: string[]) => {
        const normalizedGroupKeys = uniqueStrings(groupKeys);
        if (normalizedGroupKeys.length === 0) return;

        setUnreadGroupKeys((prev) => prev.filter((groupKey) => !normalizedGroupKeys.includes(groupKey)));

        void apiService.markOrderGroupsSeen({ groupKeys: normalizedGroupKeys })
            .then(() => fetchUnreadSnapshot())
            .catch(() => undefined);
    };

    const clearSupplierNotification = () => {
        setHasSupplierNotification(false);
        persistRedDotState(false);
        void apiService.markSupplierAlertSeen()
            .then(() => fetchUnreadSnapshot())
            .catch(() => undefined);
    };

    return (
        <OrderContext.Provider
            value={{
                approvedOrders,
                unreadGroupKeys,
                hasSupplierNotification,
                clearSupplierNotification,
                markGroupsAsRead,
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
