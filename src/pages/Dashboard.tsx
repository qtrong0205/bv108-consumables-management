import { useEffect } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import UsageChart from '@/components/dashboard/UsageChart';
import TopItemsTable from '@/components/dashboard/TopItemsTable';
import { Package, AlertTriangle, ShoppingCart, CheckCircle } from 'lucide-react';

export default function Dashboard() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const metrics = [
        {
            title: 'Tổng số vật tư trong kho',
            value: '1,247',
            icon: Package,
            color: 'text-primary',
        },
        {
            title: 'Vật tư sắp hết',
            value: '23',
            icon: AlertTriangle,
            color: 'text-warning',
        },
        {
            title: 'Đơn hàng chờ xử lý',
            value: '8',
            icon: ShoppingCart,
            color: 'text-secondary',
        },
        {
            title: 'Yêu cầu mua sắm đã duyệt',
            value: '15',
            icon: CheckCircle,
            color: 'text-success',
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <UsageChart />
                </div>
                <div className="lg:col-span-1">
                    <TopItemsTable />
                </div>
            </div>
        </div>
    );
}
