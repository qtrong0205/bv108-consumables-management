import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import OrderRequestTable from '@/components/inventory/OrderRequestTable';
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
                description: "Vui lòng chọn ít nhất một đơn hàng để đặt",
                variant: "destructive"
            });
            return;
        }

        const selectedCompanies = activeOrders
            .filter(order => selectedOrders.includes(order.id))
            .map(order => order.nhaThau)
            .filter((value, index, self) => self.indexOf(value) === index);

        toast({
            title: "Đặt hàng thành công",
            description: `Đã gửi email đến ${selectedCompanies.length} nhà thầu: ${selectedCompanies.join(', ')}`,
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
                                    <div className="rounded-md border border-border overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-primary text-primary-foreground">
                                                    <tr>
                                                        <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">STT</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà thầu</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT cũ</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Tên vật tư</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Ngày đặt</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderHistory.map((order, index) => (
                                                        <tr key={`${order.id}-${index}`} className="border-b border-border hover:bg-muted/50">
                                                            <td className="px-4 py-3 text-xs text-foreground text-center">{index + 1}</td>
                                                            <td className="px-4 py-3 text-xs text-foreground">{order.nhaThau}</td>
                                                            <td className="px-4 py-3 text-xs font-mono text-foreground">{order.maVtytCu}</td>
                                                            <td className="px-4 py-3 text-sm text-foreground">
                                                                <div className="max-w-[200px]">
                                                                    <p className="font-medium truncate" title={order.tenVtytBv}>{order.tenVtytBv}</p>
                                                                    <p className="text-xs text-muted-foreground truncate" title={order.maHieu}>{order.maHieu}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-foreground">{order.hangSx}</td>
                                                            <td className="px-4 py-3 text-xs text-foreground">
                                                                {new Date(order.ngayDatHang).toLocaleDateString('vi-VN')}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center">
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    {order.trangThai}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">
                                            Chưa có lịch sử đặt hàng
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
