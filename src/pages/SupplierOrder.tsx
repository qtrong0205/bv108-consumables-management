import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

import OrderRequestTable from '@/components/orders/OrderRequestTable';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable';

import { OrderHistory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useOrder } from '@/context/OrderContext';

export default function SupplierOrder() {
    const { toast } = useToast();
    const { approvedOrders, removeOrders, orderHistory, addToOrderHistory } = useOrder();

    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

    const activeOrders = approvedOrders;

    const handlePlaceOrder = () => {
        if (selectedOrders.length === 0) {
            toast({
                title: 'Chưa chọn đơn hàng',
                description: 'Vui lòng chọn ít nhất một vật tư để đặt hàng',
                variant: 'destructive',
            });
            return;
        }

        const now = new Date();

        const newHistory: OrderHistory[] = activeOrders
            .filter(order => selectedOrders.includes(order.id))
            .map(order => ({
                ...order,
                ngayDatHang: now,
                trangThai: 'Đã gửi email',
                emailSent: true,
            }));

        removeOrders(selectedOrders);

        addToOrderHistory(newHistory);
        setSelectedOrders([]);

        toast({
            title: 'Đặt hàng thành công',
            description: `Đã gửi ${newHistory.length} vật tư`,
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Gọi hàng</h1>
                <p className="text-muted-foreground">
                    Danh sách vật tư chờ gọi (từ dự trù đã duyệt)
                </p>
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
                                disabled={selectedOrders.length === 0}
                                className="gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                ĐẶT HÀNG ({selectedOrders.length})
                            </Button>
                        </div>

                        <TabsContent value="active">
                            {activeOrders.length > 0 ? (
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
                            {orderHistory.length > 0 ? (
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
        </div>
    );
}
