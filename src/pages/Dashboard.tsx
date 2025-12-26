import { useEffect } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import UsageChart from '@/components/dashboard/UsageChart';
import TopItemsTable from '@/components/dashboard/TopItemsTable';
import InventoryByGroupChart from '@/components/dashboard/InventoryByGroupChart';
import { Package, AlertTriangle, ShoppingCart, CheckCircle } from 'lucide-react';
import { MOCK_MEDICAL_SUPPLIES } from '@/data/mockData';

export default function Dashboard() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Tính toán thống kê từ mock data
    const totalItems = MOCK_MEDICAL_SUPPLIES.length;
    const lowStockItems = MOCK_MEDICAL_SUPPLIES.filter(
        item => item.soLuongTon < item.soLuongToiThieu
    ).length;
    const pendingOrders = 8; // Mock data cho đơn hàng chờ xử lý
    const approvedRequests = 15; // Mock data cho yêu cầu đã duyệt

    const metrics = [
        {
            title: 'Tổng số vật tư trong kho',
            value: totalItems.toLocaleString('vi-VN'),
            icon: Package,
            color: 'text-primary',
            linkTo: '/catalog',
        },
        {
            title: 'Vật tư sắp hết',
            value: lowStockItems.toString(),
            icon: AlertTriangle,
            color: 'text-warning',
            linkTo: '/catalog?filter=low-stock',
        },
        {
            title: 'Đơn hàng chờ xử lý',
            value: pendingOrders.toString(),
            icon: ShoppingCart,
            color: 'text-secondary',
            linkTo: '/orders',
        },
        {
            title: 'Yêu cầu mua sắm đã duyệt',
            value: approvedRequests.toString(),
            icon: CheckCircle,
            color: 'text-success',
            linkTo: '/procurement',
        },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">Tổng quan Khoa Bệnh Viện TWQĐ 108</h1>
                <p className="text-muted-foreground">Tổng quan về tồn kho và hoạt động vật tư y tế</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UsageChart />
                <InventoryByGroupChart />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <TopItemsTable />
            </div>
        </div>
    );
}
