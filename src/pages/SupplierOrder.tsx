import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';

import OrderRequestTable from '@/components/orders/OrderRequestTable';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';

import { OrderRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useOrder } from '@/context/OrderContext';

export default function SupplierOrder() {
    const { toast } = useToast();
    const { approvedOrders, orderHistory, addManualOrder, placeOrders, loadingOrders, refreshOrders } = useOrder();

    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeOrders = approvedOrders;

    useEffect(() => {
        void refreshOrders().catch(() => undefined);
    }, []);

    const handlePlaceOrder = async () => {
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
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Gọi hàng</h1>
                    <p className="text-muted-foreground">
                        Danh sách vật tư chờ gọi (từ dự trù đã duyệt)
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Plus className="w-4 h-4" />
                    Tạo đơn hàng mới
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="active">
                        <div className="flex justify-between mb-4">
                            <TabsList className="grid grid-cols-2 w-[300px]">
                                <TabsTrigger value="active">
                                    Đơn cần gọi ({activeOrders.length})
                                </TabsTrigger>
                                <TabsTrigger value="history">
                                    Lịch sử ({orderHistory.length})
                                </TabsTrigger>
                            </TabsList>

                            <Button
                                onClick={handlePlaceOrder}
                                disabled={selectedOrders.length === 0 || isSubmitting}
                                className="gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                {isSubmitting ? 'ĐANG XỬ LÝ...' : `ĐẶT HÀNG (${selectedOrders.length})`}
                            </Button>
                        </div>

                        <TabsContent value="active">
                            {loadingOrders ? (
                                <p className="text-center text-muted-foreground py-12">
                                    Đang tải danh sách gọi hàng...
                                </p>
                            ) : activeOrders.length > 0 ? (
                                <OrderRequestTable
                                    orders={activeOrders}
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
