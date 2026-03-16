import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MedicalSupply } from '@/types';

const COLORS = ['#0066CC', '#00A86B', '#FFB020', '#E53935', '#7B61FF', '#00BCD4', '#FF9800', '#9C27B0'];
const MAX_GROUPS = 6;

interface InventoryByGroupChartProps {
    supplies: MedicalSupply[];
    loading?: boolean;
}

export default function InventoryByGroupChart({ supplies, loading }: InventoryByGroupChartProps) {
    // Tính tổng số lượng tồn theo nhóm (sử dụng trường tenNhom)
    const groupData = supplies.reduce((acc, item) => {
        const groupName = item.tenNhom || 'Chưa phân loại';
        const existing = acc.find(g => g.name === groupName);
        if (existing) {
            existing.value += item.soLuongTon;
        } else {
            acc.push({ name: groupName, value: item.soLuongTon });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    // Sắp xếp theo số lượng giảm dần
    groupData.sort((a, b) => b.value - a.value);

    const chartData = (() => {
        if (groupData.length <= MAX_GROUPS) {
            return groupData;
        }

        const topGroups = groupData.slice(0, MAX_GROUPS - 1);
        const otherTotal = groupData.slice(MAX_GROUPS - 1).reduce((sum, g) => sum + g.value, 0);

        return [...topGroups, { name: 'Nhóm khác', value: otherTotal }];
    })();

    const totalValue = chartData.reduce((sum, g) => sum + g.value, 0);

    return (
        <Card className="bg-neutral border-border">
            <CardHeader>
                <CardTitle className="text-foreground text-base">Tồn kho theo nhóm vật tư</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                        Đang tải dữ liệu...
                    </div>
                ) : groupData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                        Không có dữ liệu
                    </div>
                ) : (
                    <div className="space-y-3">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={52}
                                    outerRadius={88}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={false}
                                    labelLine={false}
                                >
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(0, 0%, 100%)',
                                        border: '1px solid hsl(210, 14%, 90%)',
                                        borderRadius: '8px',
                                        color: 'hsl(210, 10%, 18%)',
                                    }}
                                    formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đơn vị`, 'Số lượng tồn']}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="text-xs text-muted-foreground text-center">
                            Tổng tồn: <span className="font-medium text-foreground">{totalValue.toLocaleString('vi-VN')}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            {chartData.map((item, index) => {
                                const percent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                                return (
                                    <div key={item.name} className="flex items-center gap-2 min-w-0" title={item.name}>
                                        <span
                                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="truncate text-foreground">{item.name}</span>
                                        <span className="text-muted-foreground shrink-0">{percent.toFixed(0)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
