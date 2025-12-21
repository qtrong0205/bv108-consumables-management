import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Package } from 'lucide-react';

interface Order {
    id: string;
    orderNumber: string;
    orderName: string;
    supplier: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdDate: string;
    estimatedDelivery: string;
    items: number;
}

const mockOrders: Order[] = [
    {
        id: '1',
        orderNumber: 'ORD-2024-001',
        orderName: 'Vật tư y tế Quý 1',
        supplier: 'Công ty Vật tư Y tế',
        status: 'delivered',
        priority: 'medium',
        createdDate: '2024-01-10',
        estimatedDelivery: '2024-01-20',
        items: 12,
    },
    {
        id: '2',
        orderNumber: 'ORD-2024-002',
        orderName: 'Đồ bảo hộ khẩn cấp',
        supplier: 'Công ty Y tế Sức khỏe',
        status: 'shipped',
        priority: 'urgent',
        createdDate: '2024-01-18',
        estimatedDelivery: '2024-01-25',
        items: 8,
    },
    {
        id: '3',
        orderNumber: 'ORD-2024-003',
        orderName: 'Thiết bị phẫu thuật',
        supplier: 'Công ty Chăm sóc Tĩnh mạch',
        status: 'processing',
        priority: 'high',
        createdDate: '2024-01-20',
        estimatedDelivery: '2024-01-28',
        items: 15,
    },
    {
        id: '4',
        orderNumber: 'ORD-2024-004',
        orderName: 'Vật tư tiêu hao hàng tháng',
        supplier: 'Công ty Vệ sinh Y tế',
        status: 'pending',
        priority: 'low',
        createdDate: '2024-01-22',
        estimatedDelivery: '2024-02-05',
        items: 25,
    },
];

const statusColors = {
    pending: 'bg-gray-500 text-white',
    processing: 'bg-secondary text-secondary-foreground',
    shipped: 'bg-warning text-warning-foreground',
    delivered: 'bg-success text-success-foreground',
};

const statusLabels = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
};

const priorityColors = {
    low: 'bg-gray-400 text-white',
    medium: 'bg-secondary text-secondary-foreground',
    high: 'bg-warning text-warning-foreground',
    urgent: 'bg-destructive text-destructive-foreground',
};

const priorityLabels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    urgent: 'Khẩn cấp',
};

interface OrderManagementProps {
    userRole: string;
}

export default function OrderManagement({ userRole }: OrderManagementProps) {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Quản lý đơn hàng</h1>
                <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng mua sắm</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-neutral border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                                <p className="text-2xl font-semibold text-foreground mt-1">{mockOrders.length}</p>
                            </div>
                            <Package className="w-8 h-8 text-primary" strokeWidth={2} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Chờ xử lý</p>
                                <p className="text-2xl font-semibold text-foreground mt-1">
                                    {mockOrders.filter((o) => o.status === 'pending').length}
                                </p>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Đang vận chuyển</p>
                                <p className="text-2xl font-semibold text-foreground mt-1">
                                    {mockOrders.filter((o) => o.status === 'shipped').length}
                                </p>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-warning" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Đã giao</p>
                                <p className="text-2xl font-semibold text-foreground mt-1">
                                    {mockOrders.filter((o) => o.status === 'delivered').length}
                                </p>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-success" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral border-border">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-primary text-primary-foreground">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Số đơn hàng</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Tên đơn hàng</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Nhà cung cấp</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Độ ưu tiên</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Ngày tạo</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Dự kiến giao</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Số lượng</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {mockOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-tertiary transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-foreground">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{order.orderName}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{order.supplier}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <Badge className={statusColors[order.status]}>
                                                {statusLabels[order.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <Badge className={priorityColors[order.priority]}>
                                                {priorityLabels[order.priority]}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">{order.createdDate}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{order.estimatedDelivery}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{order.items}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                                            >
                                                <Eye className="w-4 h-4 mr-1" strokeWidth={2} />
                                                Xem
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
