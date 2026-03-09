import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceTable from '@/components/orders/InvoiceTable';
import UBotInvoiceTable from '@/components/orders/UBotInvoiceTable';
import { useOrder } from '@/context/OrderContext';
import { useInvoiceData } from '@/hooks/use-invoice-data';
import { useHoaDonUBot } from '@/hooks/use-hoadon-ubot';

export default function InvoiceManagement() {
    // Load invoice data từ uBot
    useInvoiceData();
    
    const { invoices, orderHistory } = useOrder();
    const { hoaDons, loading, error, refetch } = useHoaDonUBot();

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Hóa đơn</h1>
                <p className="text-muted-foreground">
                    Quản lý và đối chiếu hóa đơn từ UBot
                </p>
            </div>

            <Tabs defaultValue="reconcile" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="reconcile">Đối chiếu đơn hàng</TabsTrigger>
                    <TabsTrigger value="ubot">Hóa đơn UBot</TabsTrigger>
                </TabsList>

                <TabsContent value="reconcile" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <InvoiceTable 
                                orders={orderHistory}
                                invoices={invoices}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ubot" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            {error ? (
                                <div className="text-center py-8">
                                    <div className="text-destructive mb-2">Lỗi tải dữ liệu</div>
                                    <div className="text-sm text-muted-foreground">{error}</div>
                                </div>
                            ) : (
                                <UBotInvoiceTable 
                                    hoaDons={hoaDons}
                                    loading={loading}
                                    onRefresh={refetch}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
