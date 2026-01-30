import { Card, CardContent } from '@/components/ui/card';
import InvoiceTable from '@/components/orders/InvoiceTable';
import { useOrder } from '@/context/OrderContext';
import { useInvoiceData } from '@/hooks/use-invoice-data';

export default function InvoiceManagement() {
    // Load invoice data từ uBot
    useInvoiceData();
    
    const { invoices, orderHistory } = useOrder();

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Hóa đơn</h1>
                <p className="text-muted-foreground">
                    Đối chiếu đơn hàng đã gửi email với hóa đơn từ uBot
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <InvoiceTable 
                        orders={orderHistory}
                        invoices={invoices}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
