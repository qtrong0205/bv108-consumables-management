import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MedicalSupply } from '@/types';

interface LowStockChartProps {
    supplies: MedicalSupply[];
    loading?: boolean;
}

interface ChartDataPoint {
    name: string;
    soLuongTon: number;
    soLuongToiThieu: number;
}

// Hàm rút ngắn tên vật tư để tránh chiều dài quá lớn
const truncateName = (name: string, maxLength: number = 25): string => {
    if (!name) return 'Không xác định';
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

export default function LowStockChart({ supplies, loading = false }: LowStockChartProps) {
    // Tính toán dữ liệu biểu đồ từ supplies
    const chartData = useMemo(() => {
        if (!supplies || supplies.length === 0) {
            return [];
        }

        // Sắp xếp theo soLuongTon tăng dần (lấy top 5 thấp nhất)
        const sorted = [...supplies]
            .filter(item => item.soLuongTon >= 0) // Lọc bỏ số âm
            .sort((a, b) => (a.soLuongTon || 0) - (b.soLuongTon || 0))
            .slice(0, 5); // Lấy top 5

        // Tạo dữ liệu cho biểu đồ với tên rút ngắn
        return sorted.map((item) => ({
            name: truncateName(item.tenVtyt || 'Không xác định', 25),
            soLuongTon: Math.max(0, item.soLuongTon || 0), // Đảm bảo không âm
            soLuongToiThieu: Math.max(0, item.soLuongToiThieu || 0), // Đảm bảo không âm
        }));
    }, [supplies]);

    if (loading) {
        return (
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Top 5 vật tư tồn kho thấp nhất</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-72 flex items-center justify-center text-muted-foreground">
                        Đang tải dữ liệu...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Top 5 vật tư tồn kho thấp nhất</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-72 flex items-center justify-center text-muted-foreground">
                        Không có dữ liệu vật tư
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-neutral border-border">
            <CardHeader>
                <CardTitle className="text-foreground">Top 5 vật tư tồn kho thấp nhất</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 0, bottom: 80 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 90%)" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            stroke="hsl(210, 10%, 30%)"
                            style={{ fontSize: '11px' }}
                        />
                        <YAxis
                            stroke="hsl(210, 10%, 30%)"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(0, 0%, 100%)',
                                border: '1px solid hsl(210, 14%, 90%)',
                                borderRadius: '8px',
                                color: 'hsl(210, 10%, 18%)',
                            }}
                            formatter={(value: number) => value.toLocaleString('vi-VN')}
                            labelFormatter={(label: string) => `${label}`}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '16px',
                            }}
                            formatter={(value: string) => {
                                if (value === 'soLuongTon') return 'Tồn hiện tại';
                                if (value === 'soLuongToiThieu') return 'Mức tối thiểu';
                                return value;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="soLuongTon"
                            stroke="hsl(148, 64%, 42%)"
                            dot={{ fill: 'hsl(148, 64%, 42%)', r: 3 }}
                            activeDot={{ r: 5 }}
                            strokeWidth={2}
                            name="Tồn hiện tại"
                        />
                        <Line
                            type="monotone"
                            dataKey="soLuongToiThieu"
                            stroke="hsl(25, 88%, 53%)"
                            dot={{ fill: 'hsl(25, 88%, 53%)', r: 3 }}
                            activeDot={{ r: 5 }}
                            strokeWidth={2}
                            name="Mức tối thiểu"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
