import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail, Plus, RotateCcw, Loader2 } from 'lucide-react';

import OrderRequestTable from '@/components/orders/OrderRequestTable';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import { buildOrderHistoryGroups } from '@/components/orders/orderHistoryUtils';

import { OrderRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useOrder } from '@/context/OrderContext';
import { apiService, getStoredAuth } from '@/services/api';
import { canCreateManualOrders, canPlaceOrders } from '@/lib/auth';
import { useStoredAuth } from '@/hooks/use-stored-auth';

const getCurrentSupplierOrderSessionKey = (): string => {
    const auth = getStoredAuth();
    if (!auth) {
        return 'anonymous';
    }

    return `${auth.user.id}:${auth.expiresAt}`;
};

type SupplierOrderUiCache = {
    sessionKey: string;
    activeTab: string;
    selectedOrders: number[];
    selectedHistoryOrders: number[];
};

const supplierOrderUiCache: SupplierOrderUiCache = {
    sessionKey: getCurrentSupplierOrderSessionKey(),
    activeTab: 'active',
    selectedOrders: [],
    selectedHistoryOrders: [],
};

const ensureSupplierOrderUiCacheForCurrentSession = () => {
    const currentSessionKey = getCurrentSupplierOrderSessionKey();
    if (supplierOrderUiCache.sessionKey === currentSessionKey) {
        return;
    }

    supplierOrderUiCache.sessionKey = currentSessionKey;
    supplierOrderUiCache.activeTab = 'active';
    supplierOrderUiCache.selectedOrders = [];
    supplierOrderUiCache.selectedHistoryOrders = [];
};

export default function SupplierOrder() {
    ensureSupplierOrderUiCacheForCurrentSession();

    const { toast } = useToast();
    const storedAuth = useStoredAuth();
    const currentRole = storedAuth?.user.role ?? '';
    const {
        approvedOrders,
        unreadGroupKeys,
        hasSupplierNotification,
        clearSupplierNotification,
        markGroupsAsRead,
        orderHistory,
        addManualOrder,
        loadingOrders,
        refreshOrders,
    } = useOrder();
    const canCreateOrders = canCreateManualOrders(currentRole);
    const canSubmitOrders = canPlaceOrders(currentRole);
    const placeOrderRoleTooltip = 'Chỉ Admin, Chỉ huy khoa, Thủ kho hoặc Nhân viên thầu mới được thực hiện thao tác này.';

    const [activeTab, setActiveTab] = useState(supplierOrderUiCache.activeTab);
    const [selectedOrders, setSelectedOrders] = useState<number[]>(supplierOrderUiCache.selectedOrders);
    const [selectedHistoryOrders, setSelectedHistoryOrders] = useState<number[]>(supplierOrderUiCache.selectedHistoryOrders);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<number | null>(null);
    const [processingText, setProcessingText] = useState<string>('');

    useEffect(() => {
        supplierOrderUiCache.activeTab = activeTab;
        supplierOrderUiCache.selectedOrders = selectedOrders;
        supplierOrderUiCache.selectedHistoryOrders = selectedHistoryOrders;
    }, [activeTab, selectedOrders, selectedHistoryOrders]);

    useEffect(() => {
        if (!hasSupplierNotification) return;

        const timeoutId = window.setTimeout(() => {
            clearSupplierNotification();
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [hasSupplierNotification, clearSupplierNotification]);

    const activeOrders = approvedOrders;
    const historyOrderCount = useMemo(() => buildOrderHistoryGroups(orderHistory).length, [orderHistory]);

    useEffect(() => {
        const validIds = new Set(activeOrders.map((order) => order.id));
        setSelectedOrders((prev) => prev.filter((id) => validIds.has(id)));
    }, [activeOrders]);

    useEffect(() => {
        const validIds = new Set(orderHistory.map((order) => order.id));
        setSelectedHistoryOrders((prev) => prev.filter((id) => validIds.has(id)));
    }, [orderHistory]);

    useEffect(() => {
        void refreshOrders().catch(() => undefined);
    }, []);

    const handlePlaceOrder = async () => {
        if (!canSubmitOrders) {
            toast({
                title: 'Không có quyền đặt hàng',
                description: 'Chỉ Admin, Chỉ huy khoa, Thủ kho hoặc Nhân viên thầu mới có quyền bấm nút Đặt hàng.',
                variant: 'destructive',
            });
            return;
        }

        if (selectedOrders.length === 0) {
            toast({
                title: 'Chưa chọn đơn hàng',
                description: 'Vui lòng chọn ít nhất một vật tư để đặt hàng',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        const batchSize = 30;
        const totalItems = selectedOrders.length;

        setProcessingProgress(0);
        setProcessingText(`Đang tiến hành đặt hàng...`);
        let totalPlacedCount = 0;

        try {
            for (let i = 0; i < totalItems; i += batchSize) {
                const chunk = selectedOrders.slice(i, i + batchSize);
                const response = await apiService.placeOrders({ orderIds: chunk });
                totalPlacedCount += response.placedCount;

                const percent = Math.round((Math.min(i + batchSize, totalItems) / totalItems) * 100);
                setProcessingProgress(percent);
                setProcessingText(`Đang tiến hành đặt hàng... (${percent}%)`);
            }

            await refreshOrders();
            setSelectedOrders([]);

            toast({
                title: 'Đặt hàng thành công',
                description: `Đã gửi ${totalPlacedCount} vật tư`,
            });
        } catch (error) {
            toast({
                title: 'Đặt hàng thất bại',
                description: error instanceof Error ? error.message : 'Không thể lưu lịch sử đơn hàng',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setProcessingProgress(null);
        }
    };

    const handleCreateOrder = async (order: OrderRequest) => {
        if (!canCreateOrders) {
            toast({
                title: 'Không có quyền tạo đơn hàng',
                description: 'Chỉ Admin hoặc Chỉ huy khoa mới được tạo đơn hàng thủ công.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await addManualOrder(order);
            setIsCreateDialogOpen(false);

            toast({
                title: 'Tạo đơn hàng thành công',
                description: `Đơn hàng "${order.tenVtytBv}" đã được thêm vào danh sách gọi hàng`,
            });
        } catch (error) {
            toast({
                title: 'Tạo đơn hàng thất bại',
                description: error instanceof Error ? error.message : 'Không thể lưu đơn hàng mới',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReorderHistoryOrders = async (ids: number[]) => {
        if (!canSubmitOrders) {
            toast({
                title: 'Không có quyền đặt hàng',
                description: 'Chỉ Admin, Chỉ huy khoa, Thủ kho hoặc Nhân viên thầu mới có quyền đặt lại đơn hàng.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        const batchSize = 30;
        const totalItems = ids.length;

        setProcessingProgress(0);
        setProcessingText(`Đang tiến hành đặt lại đơn hàng...`);
        let totalRepeatedCount = 0;

        try {
            for (let i = 0; i < totalItems; i += batchSize) {
                const chunk = ids.slice(i, i + batchSize);
                const response = await apiService.reorderHistoryOrders({ orderIds: chunk });
                totalRepeatedCount += response.placedCount;

                const percent = Math.round((Math.min(i + batchSize, totalItems) / totalItems) * 100);
                setProcessingProgress(percent);
                setProcessingText(`Đang tiến hành đặt lại đơn hàng... (${percent}%)`);
            }

            await refreshOrders();
            setSelectedHistoryOrders([]);

            toast({
                title: 'Đặt lại đơn hàng thành công',
                description: `Đã gửi lại ${totalRepeatedCount} vật tư`,
            });
        } catch (error) {
            toast({
                title: 'Đặt lại đơn hàng thất bại',
                description: error instanceof Error ? error.message : 'Không thể đặt lại lịch sử đơn hàng',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setProcessingProgress(null);
        }
    };

    const isHistoryTab = activeTab === 'history';
    const topActionCount = isHistoryTab ? selectedHistoryOrders.length : selectedOrders.length;
    const topActionTooltip = !canSubmitOrders
        ? placeOrderRoleTooltip
        : topActionCount === 0
            ? (isHistoryTab
                ? 'Vui lòng chọn ít nhất một vật tư trong lịch sử để đặt lại.'
                : 'Vui lòng chọn ít nhất một vật tư để đặt hàng.')
            : undefined;

    const handleTopAction = () => {
        if (isHistoryTab) {
            void handleReorderHistoryOrders(selectedHistoryOrders);
            return;
        }
        void handlePlaceOrder();
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-tertiary/95 backdrop-blur supports-[backdrop-filter]:bg-tertiary/80 border-b border-border flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Gọi hàng</h1>
                    <p className="text-muted-foreground">
                        Danh sách vật tư chờ gọi (từ dự trù đã duyệt)
                    </p>
                </div>
                {canCreateOrders && (
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo đơn hàng mới
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border/70 pb-3 mb-4 flex justify-between">
                            <TabsList className="grid grid-cols-2 w-[300px]">
                                <TabsTrigger value="active">
                                    Đơn cần gọi ({activeOrders.length})
                                </TabsTrigger>
                                <TabsTrigger value="history">
                                    Lịch sử ({historyOrderCount})
                                </TabsTrigger>
                            </TabsList>

                            {canSubmitOrders && (
                                <span className="inline-flex" title={topActionTooltip}>
                                    <Button
                                        onClick={handleTopAction}
                                        disabled={topActionCount === 0 || isSubmitting}
                                        className="gap-2"
                                    >
                                        {isHistoryTab ? <RotateCcw className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                        {isSubmitting
                                            ? 'ĐANG XỬ LÝ...'
                                            : isHistoryTab
                                                ? `ĐẶT LẠI (${selectedHistoryOrders.length})`
                                                : `ĐẶT HÀNG (${selectedOrders.length})`}
                                    </Button>
                                </span>
                            )}
                        </div>

                        <TabsContent value="active">
                            {loadingOrders ? (
                                <p className="text-center text-muted-foreground py-12">
                                    Đang tải danh sách gọi hàng...
                                </p>
                            ) : activeOrders.length > 0 ? (
                                <OrderRequestTable
                                    orders={activeOrders}
                                    unreadGroupKeys={unreadGroupKeys}
                                    onMarkGroupsRead={markGroupsAsRead}
                                    selectedOrders={selectedOrders}
                                    setSelectedOrders={setSelectedOrders}
                                />
                            ) : (
                                <p className="text-center text-muted-foreground py-12">
                                    Chưa có vật tư nào được duyệt để gọi hàng
                                </p>
                            )}
                        </TabsContent>

                        <TabsContent value="history">
                            {loadingOrders ? (
                                <p className="text-center text-muted-foreground py-12">
                                    Đang tải lịch sử gọi hàng...
                                </p>
                            ) : orderHistory.length > 0 ? (
                                <OrderHistoryTable
                                    orders={orderHistory}
                                    selectedOrderIds={selectedHistoryOrders}
                                    setSelectedOrderIds={setSelectedHistoryOrders}
                                />
                            ) : (
                                <p className="text-center text-muted-foreground py-12">
                                    Chưa có lịch sử gọi hàng
                                </p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <CreateOrderDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateOrder}
            />

            {/* Backdrop khóa màn hình hiển thị tiến trình đặt hàng */}
            {processingProgress !== null && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm">
                    <div className="bg-neutral p-6 rounded-xl border border-border shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="font-semibold text-foreground text-center mb-2 text-sm">{processingText}</p>
                        <div className="w-full bg-tertiary h-3 rounded-full overflow-hidden border border-border mt-2">
                            <div 
                                className="bg-primary h-full transition-all duration-300 rounded-full"
                                style={{ width: `${processingProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{processingProgress}% hoàn thành</p>
                        <p className="text-[10px] text-red-500/80 mt-4 text-center">Vui lòng không thao tác hoặc tải lại trang trong quá trình này.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
