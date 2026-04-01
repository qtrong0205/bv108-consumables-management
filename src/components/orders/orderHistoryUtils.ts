import { OrderHistory } from '@/types';

export type OrderHistoryGroupSource = OrderHistory['source'] | 'mixed';

export interface OrderBatchHistoryGroup {
    groupKey: string;
    nhaThau: string;
    orders: OrderHistory[];
    totalOrders: number;
    batchTime: string | Date | undefined;
    sortTime: number;
    latestOrderId: number;
    source: OrderHistoryGroupSource;
}

export const normalizeOrderCompanyName = (name?: string) => {
    const normalized = (name || '').trim();
    return normalized.length > 0 ? normalized : 'Chưa xác định công ty';
};

export const getOrderHistoryTime = (value?: string | Date) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

export const getOrderHistoryBatchKey = (order: OrderHistory) => {
    const batchKey = (order.orderBatchKey || '').trim();
    if (batchKey.length > 0) {
        return batchKey;
    }

    const companyKey = normalizeOrderCompanyName(order.nhaThau).toLowerCase();
    const orderTimeKey = String(order.ngayDatHang || '').trim();
    return `${companyKey}__${orderTimeKey || `id-${order.id}`}`;
};

export const buildOrderHistoryGroups = (orders: OrderHistory[]): OrderBatchHistoryGroup[] => {
    const groups: Record<string, OrderBatchHistoryGroup> = {};

    orders.forEach((order) => {
        const groupKey = getOrderHistoryBatchKey(order);
        const orderTime = getOrderHistoryTime(order.ngayDatHang);
        const normalizedCompanyName = normalizeOrderCompanyName(order.nhaThau);

        if (!groups[groupKey]) {
            groups[groupKey] = {
                groupKey,
                nhaThau: normalizedCompanyName,
                orders: [],
                totalOrders: 0,
                batchTime: order.ngayDatHang,
                sortTime: orderTime,
                latestOrderId: order.id,
                source: order.source || 'forecast',
            };
        }

        groups[groupKey].orders.push(order);
        groups[groupKey].totalOrders += 1;

        if (
            orderTime > groups[groupKey].sortTime
            || (orderTime === groups[groupKey].sortTime && order.id > groups[groupKey].latestOrderId)
        ) {
            groups[groupKey].sortTime = orderTime;
            groups[groupKey].batchTime = order.ngayDatHang;
            groups[groupKey].latestOrderId = order.id;
        }

        if (groups[groupKey].source !== order.source) {
            groups[groupKey].source = 'mixed';
        }
    });

    return Object.values(groups)
        .map((group) => ({
            ...group,
            orders: [...group.orders].sort((a, b) => {
                const timeDiff = getOrderHistoryTime(b.ngayDatHang) - getOrderHistoryTime(a.ngayDatHang);
                if (timeDiff !== 0) {
                    return timeDiff;
                }
                return b.id - a.id;
            }),
        }))
        .sort((a, b) => {
            const timeDiff = b.sortTime - a.sortTime;
            if (timeDiff !== 0) {
                return timeDiff;
            }

            const idDiff = b.latestOrderId - a.latestOrderId;
            if (idDiff !== 0) {
                return idDiff;
            }

            return a.nhaThau.localeCompare(b.nhaThau, 'vi');
        });
};
