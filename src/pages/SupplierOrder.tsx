import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

const supplierOrderUiCache = {
    activeTab: 'active',
    selectedOrders: [] as number[],
};
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';

import OrderRequestTable from '@/components/orders/OrderRequestTable';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import { buildOrderHistoryGroups } from '@/components/orders/orderHistoryUtils';

import { OrderRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useOrder } from '@/context/OrderContext';
import { getStoredAuth } from '@/services/api';
import { canCreateManualOrders, canPlaceOrders } from '@/lib/auth';

export default function SupplierOrder() {
    const { toast } = useToast();
    const currentRole = useMemo(() => getStoredAuth()?.user.role ?? '', []);
    const {
        approvedOrders,
        unreadGroupKeys,
        hasSupplierNotification,
        clearSupplierNotification,
        markGroupsAsRead,
        orderHistory,
        addManualOrder,
        placeOrders,
        loadingOrders,
        refreshOrders
    } = useOrder();
    const canCreateOrders = canCreateManualOrders(currentRole);
    const canSubmitOrders = canPlaceOrders(currentRole);
    const createOrderRoleTooltip = 'Chỉ Admin hoặc Chỉ huy khoa mới được thực hiện thao tác này.';
    const placeOrderRoleTooltip = 'Chỉ Admin hoặc Chỉ huy khoa mới được thực hiện thao tác này.';

    const [activeTab, setActiveTab] = useState(supplierOrderUiCache.activeTab);
    const [selectedOrders, setSelectedOrders] = useState<number[]>(supplierOrderUiCache.selectedOrders);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const placeOrderDisabledTooltip = !canSubmitOrders
        ? placeOrderRoleTooltip
        : selectedOrders.length === 0
            ? 'Vui lòng chọn ít nhất một vật tư để đặt hàng.'
            : undefined;

    useEffect(() => {
        supplierOrderUiCache.activeTab = activeTab;
        supplierOrderUiCache.selectedOrders = selectedOrders;
    }, [activeTab, selectedOrders]);

    useEffect(() => {
        if (!hasSupplierNotification) return;

        const timeoutId = setTimeout(() => {
            clearSupplierNotification();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [hasSupplierNotification, clearSupplierNotification]);

    const activeOrders = approvedOrders;
    const historyOrderCount = useMemo(() => buildOrderHistoryGroups(orderHistory).length, [orderHistory]);

    useEffect(() => {
        const validIds = new Set(activeOrders.map((order) => order.id));
        setSelectedOrders((prev) => prev.filter((id) => validIds.has(id)));
    }, [activeOrders]);

    useEffect(() => {
        void refreshOrders().catch(() => undefined);
    }, []);

    const handlePlaceOrder = async () => {
        if (!canSubmitOrders) {
            toast({
                title: 'Không có quyền đặt hàng',
                description: 'Chỉ Admin hoặc Chỉ huy khoa mới có quyền bấm nút Đặt hàng.',
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
        try {
            const placedCount = await placeOrders(selectedOrders);
            setSelectedOrders([]);

            toast({
                title: 'Đặt hàng thành công',
                description: `Đã gửi ${placedCount} vật tư`,
            });
        } catch (error) {
            toast({
                title: 'Đặt hàng thất bại',
                description: error instanceof Error ? error.message : 'Không thể lưu lịch sử đơn hàng',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-tertiary/95 backdrop-blur supports-[backdrop-filter]:bg-tertiary/80 border-b border-border flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Gọi hàng</h1>
                    <p className="text-muted-foreground">
                        Danh sách vật tư chờ gọi (từ dự trù đã duyệt)
                    </p>
                </div>
                <span className="inline-flex" title={!canCreateOrders ? createOrderRoleTooltip : undefined}>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        disabled={!canCreateOrders}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo đơn hàng mới
                    </Button>
                </span>
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

                            <span className="inline-flex" title={placeOrderDisabledTooltip}>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={!canSubmitOrders || selectedOrders.length === 0 || isSubmitting}
                                    className="gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    {isSubmitting ? 'ĐANG XỬ LÝ...' : `ĐẶT HÀNG (${selectedOrders.length})`}
                                </Button>
                            </span>
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
                                <OrderHistoryTable orders={orderHistory} />
                            ) : (
                                <p className="text-center text-muted-foreground py-12">
                                    Chưa có lịch sử gọi hàng
                                </p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Dialog tạo đơn hàng mới */}
            <CreateOrderDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateOrder}
            />
        </div>
    );
}
