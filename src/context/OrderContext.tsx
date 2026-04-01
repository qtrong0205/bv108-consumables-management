import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { IVatTuDuTru } from '@/data/mockData';
import { OrderRequest, Invoice, OrderHistory } from '@/types';
import { apiService, CreateOrderItemRequest, getStoredAuth, OrderUnreadSnapshot } from '@/services/api';

export interface ActivityNotification {
    id: string;
    category?: string;
    action: string;
    actorId?: number;
    actorName: string;
    actorEmail?: string;
    count?: number;
    status?: string;
    month?: number;
    year?: number;
    createdAt: string;
}

interface OrderContextType {
    approvedOrders: OrderRequest[];
    unreadGroupKeys: string[];
    hasSupplierNotification: boolean;
    activityNotifications: ActivityNotification[];
    unreadActivityCount: number;
    realtimeEventVersion: number;
    lastRealtimeEvent: {
        type: string;
        payload?: unknown;
        receivedAt: string;
    } | null;
    markActivityNotificationsRead: () => void;
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

    return {
        nhaThau: item.nhaThau,
        maQuanLy: item.maQuanLy || '',
        maVtytCu: item.maVtytCu,
        tenVtytBv: item.tenVtytBv,
        maHieu: item.maHieu,
        hangSx: item.hangSx,
        donViTinh: item.donViTinh,
        quyCach: item.quyCach,
        dotGoiHang: finalDuTru,
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
const ACTIVITY_NOTIFICATION_STORAGE_PREFIX = 'bv108_activity_notifications_';
const ACTIVITY_NOTIFICATION_READ_AT_PREFIX = 'bv108_activity_notifications_read_at_';
const MAX_ACTIVITY_NOTIFICATIONS = 100;
const ACTIVITY_NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_PRUNE_INTERVAL_MS = 60 * 1000;

const buildWebsocketUrl = (token: string) => {
    const wsBase = API_BASE_URL.replace(/^http/i, 'ws');
    return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
};

const uniqueStrings = (values: string[]) => [...new Set(values.filter((value) => value && value.trim().length > 0))];

const parseTimestamp = (value?: string): number => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const isActivityNotificationExpired = (notification: ActivityNotification, nowTimestamp: number): boolean => {
    const createdAtTimestamp = parseTimestamp(notification.createdAt);
    if (createdAtTimestamp <= 0) {
        return false;
    }

    return nowTimestamp - createdAtTimestamp > ACTIVITY_NOTIFICATION_TTL_MS;
};

const pruneActivityNotifications = (notifications: ActivityNotification[], nowTimestamp: number): ActivityNotification[] => {
    return notifications
        .filter((notification) => !isActivityNotificationExpired(notification, nowTimestamp))
        .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt))
        .slice(0, MAX_ACTIVITY_NOTIFICATIONS);
};

const areNotificationsEqual = (left: ActivityNotification[], right: ActivityNotification[]): boolean => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index += 1) {
        if (left[index].id !== right[index].id) {
            return false;
        }
    }

    return true;
};

const normalizeActivityNotification = (payload: unknown): ActivityNotification | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const record = payload as Record<string, unknown>;
    const action = typeof record.action === 'string' ? record.action.trim() : '';
    if (!action) {
        return null;
    }

    const actorName = typeof record.actorName === 'string' && record.actorName.trim().length > 0
        ? record.actorName.trim()
        : 'Hệ thống';
    const createdAtRaw = typeof record.createdAt === 'string' ? record.createdAt.trim() : '';
    const createdAt = parseTimestamp(createdAtRaw) > 0 ? createdAtRaw : new Date().toISOString();

    const actorId = typeof record.actorId === 'number' && Number.isFinite(record.actorId)
        ? Math.trunc(record.actorId)
        : undefined;
    const count = typeof record.count === 'number' && Number.isFinite(record.count)
        ? Math.max(0, Math.trunc(record.count))
        : undefined;
    const month = typeof record.month === 'number' && Number.isFinite(record.month)
        ? Math.trunc(record.month)
        : undefined;
    const year = typeof record.year === 'number' && Number.isFinite(record.year)
        ? Math.trunc(record.year)
        : undefined;
    const id = typeof record.id === 'string' && record.id.trim().length > 0
        ? record.id.trim()
        : `${action}:${actorName}:${createdAt}:${count ?? 0}`;

    const category = typeof record.category === 'string' && record.category.trim().length > 0
        ? record.category.trim()
        : undefined;
    const actorEmail = typeof record.actorEmail === 'string' && record.actorEmail.trim().length > 0
        ? record.actorEmail.trim()
        : undefined;
    const status = typeof record.status === 'string' && record.status.trim().length > 0
        ? record.status.trim()
        : undefined;

    return {
        id,
        category,
        action,
        actorId,
        actorName,
        actorEmail,
        count,
        status,
        month,
        year,
        createdAt,
    };
};

export function OrderProvider({ children }: { children: ReactNode }) {
    const [approvedOrders, setApprovedOrders] = useState<OrderRequest[]>([]);
    const [unreadGroupKeys, setUnreadGroupKeys] = useState<string[]>([]);
    const [hasSupplierNotification, setHasSupplierNotification] = useState(false);
    const [activityNotifications, setActivityNotifications] = useState<ActivityNotification[]>([]);
    const [unreadActivityCount, setUnreadActivityCount] = useState(0);
    const [realtimeEventVersion, setRealtimeEventVersion] = useState(0);
    const [lastRealtimeEvent, setLastRealtimeEvent] = useState<{
        type: string;
        payload?: unknown;
        receivedAt: string;
    } | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const isRefreshingOrdersRef = useRef(false);
    const pendingRefreshOrdersRef = useRef(false);
    const wsRef = useRef<WebSocket | null>(null);
    const wsReconnectTimeoutRef = useRef<number | null>(null);
    const activityReadAtRef = useRef('');

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

    const getActivityNotificationsStorageKey = () => {
        const auth = getStoredAuth();
        if (!auth) return null;
        return `${ACTIVITY_NOTIFICATION_STORAGE_PREFIX}${auth.user.id}`;
    };

    const getActivityReadAtStorageKey = () => {
        const auth = getStoredAuth();
        if (!auth) return null;
        return `${ACTIVITY_NOTIFICATION_READ_AT_PREFIX}${auth.user.id}`;
    };

    const persistActivityNotifications = (notifications: ActivityNotification[]) => {
        const key = getActivityNotificationsStorageKey();
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(notifications));
    };

    const persistActivityReadAt = (readAt: string) => {
        const key = getActivityReadAtStorageKey();
        if (!key) return;
        localStorage.setItem(key, readAt);
    };

    const calculateUnreadActivityCount = (notifications: ActivityNotification[], readAt: string) => {
        const readAtTimestamp = parseTimestamp(readAt);
        const nowTimestamp = Date.now();

        const nonExpiredNotifications = notifications.filter(
            (notification) => !isActivityNotificationExpired(notification, nowTimestamp),
        );

        if (readAtTimestamp <= 0) {
            return nonExpiredNotifications.length;
        }

        return nonExpiredNotifications.filter((notification) => {
            const createdAtTimestamp = parseTimestamp(notification.createdAt);
            if (createdAtTimestamp <= 0) {
                return true;
            }
            return createdAtTimestamp > readAtTimestamp;
        }).length;
    };

    const loadPersistedActivityNotifications = (): ActivityNotification[] => {
        const key = getActivityNotificationsStorageKey();
        if (!key) return [];

        const raw = localStorage.getItem(key);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) {
                return [];
            }

            const normalized = parsed
                .map((item) => normalizeActivityNotification(item))
                .filter((item): item is ActivityNotification => item !== null);

            return pruneActivityNotifications(normalized, Date.now());
        } catch {
            return [];
        }
    };

    const pushActivityNotification = (notification: ActivityNotification) => {
        setActivityNotifications((prev) => {
            const nowTimestamp = Date.now();
            const deduped = prev.filter((item) => item.id !== notification.id);
            const next = pruneActivityNotifications([notification, ...deduped], nowTimestamp);

            persistActivityNotifications(next);
            setUnreadActivityCount(calculateUnreadActivityCount(next, activityReadAtRef.current));
            return next;
        });
    };

    const pruneStoredActivityNotifications = () => {
        setActivityNotifications((prev) => {
            const next = pruneActivityNotifications(prev, Date.now());
            if (areNotificationsEqual(prev, next)) {
                return prev;
            }

            persistActivityNotifications(next);
            setUnreadActivityCount(calculateUnreadActivityCount(next, activityReadAtRef.current));
            return next;
        });
    };

    const applyUnreadSnapshot = (snapshot: OrderUnreadSnapshot) => {
        setHasSupplierNotification((prev) => {
            const next = snapshot.hasSupplierRedDot ? true : prev;
            persistRedDotState(next);
            return next;
        });
        setUnreadGroupKeys(uniqueStrings(snapshot.unreadGroupKeys || []));
    };

    const publishRealtimeEvent = (type: string, payload?: unknown) => {
        const receivedAt = new Date().toISOString();
        setLastRealtimeEvent({ type, payload, receivedAt });
        setRealtimeEventVersion((prev) => prev + 1);
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
                    payload?: unknown;
                };
                const eventType = typeof data.type === 'string' ? data.type : '';
                if (!eventType) {
                    return;
                }

                publishRealtimeEvent(eventType, data.payload);

                if (eventType === 'notifications.activity') {
                    const normalized = normalizeActivityNotification(data.payload);
                    if (normalized) {
                        pushActivityNotification(normalized);
                    }
                    return;
                }

                if (eventType === 'orders.new_pending') {
                    const payload = data.payload as { groupKeys?: string[] };
                    setHasSupplierNotification(true);
                    persistRedDotState(true);
                    setUnreadGroupKeys((prev) => uniqueStrings([...prev, ...(payload.groupKeys || [])]));
                    void refreshOrders();
                    return;
                }

                if (eventType === 'orders.unread_updated' || eventType === 'orders.unread_snapshot') {
                    applyUnreadSnapshot(data.payload as OrderUnreadSnapshot);
                    return;
                }

                if (eventType.startsWith('orders.')) {
                    void refreshOrders();
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

        const redDotStorageKey = getRedDotStorageKey();
        if (redDotStorageKey) {
            setHasSupplierNotification(localStorage.getItem(redDotStorageKey) === '1');
        }

        const persistedNotifications = loadPersistedActivityNotifications();
        setActivityNotifications(persistedNotifications);

        const readAtStorageKey = getActivityReadAtStorageKey();
        const storedReadAt = readAtStorageKey ? (localStorage.getItem(readAtStorageKey) || '') : '';
        activityReadAtRef.current = storedReadAt;
        setUnreadActivityCount(calculateUnreadActivityCount(persistedNotifications, storedReadAt));

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

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            pruneStoredActivityNotifications();
        }, ACTIVITY_PRUNE_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
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

    const markActivityNotificationsRead = () => {
        const latestCreatedAtTimestamp = activityNotifications.reduce((latest, notification) => {
            const createdAtTimestamp = parseTimestamp(notification.createdAt);
            return createdAtTimestamp > latest ? createdAtTimestamp : latest;
        }, 0);
        const readAt = latestCreatedAtTimestamp > 0
            ? new Date(latestCreatedAtTimestamp).toISOString()
            : new Date().toISOString();

        activityReadAtRef.current = readAt;
        persistActivityReadAt(readAt);
        setUnreadActivityCount(0);
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
                activityNotifications,
                unreadActivityCount,
                realtimeEventVersion,
                lastRealtimeEvent,
                markActivityNotificationsRead,
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
