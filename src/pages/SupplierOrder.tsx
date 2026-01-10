import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import OrderRequestTable from '@/components/orders/OrderRequestTable';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable';
import { OrderRequest, OrderHistory } from '@/types';
import { MOCK_ORDER_REQUESTS, MOCK_ORDER_HISTORY } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function SupplierOrder() {
    const [activeOrders, setActiveOrders] = useState<OrderRequest[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        // Filter orders with dotGoiHang > 0 for active tab
        setActiveOrders(MOCK_ORDER_REQUESTS.filter((order: OrderRequest) => order.dotGoiHang > 0));
        setOrderHistory(MOCK_ORDER_HISTORY);
        window.scrollTo(0, 0);
    }, []);

    const handleOrderPlaced = (selectedIds: number[]) => {
        const now = new Date();
        const updatedOrders: OrderRequest[] = [];
        const newHistoryItems: OrderHistory[] = [];

        activeOrders.forEach(order => {
            if (selectedIds.includes(order.id)) {
                const newDotGoiHang = order.dotGoiHang - 1;

                if (newDotGoiHang > 0) {
                    // Still has remaining orders, keep in active list
                    updatedOrders.push({
                        ...order,
                        dotGoiHang: newDotGoiHang
                    });
                }

                // Add to history
                newHistoryItems.push({
                    ...order,
                    ngayDatHang: now,
                    trangThai: 'Đã gửi email'
                });
            } else {
                // Not selected, keep as is
                updatedOrders.push(order);
            }
        });

        setActiveOrders(updatedOrders);
        setOrderHistory([...newHistoryItems, ...orderHistory]);
        setSelectedOrders([]);
    };

    const handlePlaceOrder = () => {
        if (selectedOrders.length === 0) {
            toast({
                title: "Chưa chọn đơn hàng",
                description: "Vui lòng chọn ít nhất một vật tư để đặt hàng",
                variant: "destructive"
            });
            return;
        }

        // Nhóm vật tư theo nhà thầu
        const selectedItems = activeOrders.filter(order => selectedOrders.includes(order.id));
        const groupedBySupplier: { [key: string]: OrderRequest[] } = {};

        selectedItems.forEach(order => {
            if (!groupedBySupplier[order.nhaThau]) {
                groupedBySupplier[order.nhaThau] = [];
            }
            groupedBySupplier[order.nhaThau].push(order);
        });

        const supplierCount = Object.keys(groupedBySupplier).length;
        const supplierNames = Object.keys(groupedBySupplier).join(', ');

        toast({
            title: "Đặt hàng thành công",
            description: `Đã gửi email đến ${supplierCount} nhà thầu (${selectedItems.length} vật tư): ${supplierNames}`,
        });

        handleOrderPlaced(selectedOrders);
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Gọi Hàng</h1>
                    <p className="text-muted-foreground">Quản lý và đặt hàng vật tư y tế từ nhà thầu</p>
                </div>
            </div>

            <Card className="bg-neutral border-border">
                <CardContent className="pt-6">
                    <Tabs defaultValue="active" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="active">
                                    Đơn hàng cần gọi ({activeOrders.length})
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

                        <TabsContent value="active" className="mt-0">
                            <div className="space-y-4">
                                {activeOrders.length > 0 ? (
                                    <OrderRequestTable
                                        orders={activeOrders}
                                        selectedOrders={selectedOrders}
                                        setSelectedOrders={setSelectedOrders}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">
                                            Không có đơn hàng nào cần gọi
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0">
                            <div className="space-y-4">
                                {orderHistory.length > 0 ? (
                                    <OrderHistoryTable orders={orderHistory} />
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">
                                            Chưa có lịch sử gọi hàng
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
