import { useState } from 'react';
import { OrderRequest } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderRequestTableProps {
    orders: OrderRequest[];
    onOrderPlaced: (selectedIds: number[]) => void;
}

export default function OrderRequestTable({ orders, onOrderPlaced }: OrderRequestTableProps) {
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const { toast } = useToast();

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(orders.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId: number, checked: boolean) => {
        if (checked) {
            setSelectedOrders([...selectedOrders, orderId]);
        } else {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        }
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

        const selectedCompanies = orders
            .filter(order => selectedOrders.includes(order.id))
            .map(order => order.nhaThau)
            .filter((value, index, self) => self.indexOf(value) === index);

        toast({
            title: "Đặt hàng thành công",
            description: `Đã gửi email đến ${selectedCompanies.length} nhà thầu: ${selectedCompanies.join(', ')}`,
        });

        onOrderPlaced(selectedOrders);
        setSelectedOrders([]);
    };

    const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
    const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Chọn tất cả"
                                        className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                                    />
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">STT</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà Thầu</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã quản lí</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT cũ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Tên VT BV</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã hiệu</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Đơn vị tính</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Quy cách</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Đợt gọi hàng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                                    <td className="px-4 py-3">
                                        <Checkbox
                                            checked={selectedOrders.includes(order.id)}
                                            onCheckedChange={(checked: boolean) => handleSelectOrder(order.id, checked)}
                                            aria-label={`Chọn đơn hàng ${order.id}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground text-center">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.nhaThau}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.maQuanLy}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.maVtytCu}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.tenVtytBv}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.maHieu}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.hangSx}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{order.donViTinh}</td>
                                    <td className="px-4 py-3 text-sm text-foreground text-center">{order.quyCach}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant="outline" className="bg-tertiary text-foreground border-border text-[10px] px-1.5 py-0.5 rounded-full">
                                            {order.dotGoiHang}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <Button 
                    onClick={handlePlaceOrder} 
                    disabled={selectedOrders.length === 0}
                    className="gap-2"
                >
                    <Mail className="w-4 h-4" />
                    ĐẶT HÀNG ({selectedOrders.length})
                </Button>
            </div>
        </div>
    );
}
