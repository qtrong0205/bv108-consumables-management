import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { MedicalSupply } from '@/types';

interface PriceUsageScatterChartProps {
    supplies: MedicalSupply[];
    loading?: boolean;
}

interface ScatterDataPoint {
    name: string;
    x: number;
    y: number;
    group: string;
}

// Màu sắc cho các nhóm (nếu muốn phân biệt theo nhóm)
const getColorByGroup = (group: string): string => {
    const colorMap: Record<string, string> = {
        'Dính dán y tế': '#3b82f6',
        'Dịch truyền': '#ef4444',
        'Chăm sóc vết mổ': '#8b5cf6',
        'Kỹ thuật y tế': '#ec4899',
        'Vật tư khác': '#10b981',
    };
    return colorMap[group] || '#06b6d4';
};

export default function PriceUsageScatterChart({ supplies, loading = false }: PriceUsageScatterChartProps) {
    // Xử lý dữ liệu từ supplies
    const chartData = useMemo(() => {
        if (!supplies || supplies.length === 0) {
            return [];
        }

        // Flatten và map dữ liệu
        const data: ScatterDataPoint[] = supplies
            .filter(item => item.donGia >= 0 && item.soLuongTieuHao >= 0) // Loại bỏ dữ liệu không hợp lệ
            .map((item) => ({
                name: item.tenVtyt || 'Không xác định',
                x: item.donGia || 0,
                y: item.soLuongTieuHao || 0,
                group: item.tenNhom || 'Chưa phân loại',
            }));

        return data;
    }, [supplies]);

    if (loading) {
        return (
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Tương quan Giá và Tiêu hao</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-80">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <span className="text-muted-foreground">Đang tải dữ liệu...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!chartData || chartData.length === 0) {
        return (
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Tương quan Giá và Tiêu hao</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-80">
                    <p className="text-muted-foreground">Không có dữ liệu để hiển thị</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-neutral border-border rounded-2xl shadow-md">
            <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-lg font-semibold">
                    Tương quan Giá và Tiêu hao
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Trục X: Đơn giá | Trục Y: Số lượng tiêu hao
                </p>
            </CardHeader>
            <CardContent className="p-0 pb-6">
                <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        data={chartData}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Đơn giá (VNĐ)"
                            stroke="#6b7280"
                            label={{ value: 'Đơn giá (VNĐ)', position: 'insideBottomRight', offset: -5 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Số lượng tiêu hao"
                            stroke="#6b7280"
                            label={{ value: 'Số lượng tiêu hao', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '0.75rem',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            }}
                            cursor={{ strokeDasharray: '3 3' }}
                            formatter={(value: number, name: string) => {
                                if (name === 'x') {
                                    return [
                                        value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
                                        'Đơn giá',
                                    ];
                                } else if (name === 'y') {
                                    return [value.toLocaleString('vi-VN'), 'Số lượng tiêu hao'];
                                }
                                return [value, name];
                            }}
                            labelFormatter={(label: string) => `${label}`}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length > 0) {
                                    const data = payload[0].payload as ScatterDataPoint;
                                    return (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                            <p className="font-semibold text-sm text-gray-800 mb-1">
                                                {data.name}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                <span className="font-medium">Đơn giá:</span>{' '}
                                                {data.x.toLocaleString('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                <span className="font-medium">Tiêu hao:</span>{' '}
                                                {data.y.toLocaleString('vi-VN')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                <span className="font-medium">Nhóm:</span> {data.group}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '1rem' }}
                            formatter={() => 'Vật tư y tế'}
                        />
                        <Scatter
                            name="Vật tư y tế"
                            data={chartData}
                            fill="#06b6d4"
                            fillOpacity={0.6}
                            r={5}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
