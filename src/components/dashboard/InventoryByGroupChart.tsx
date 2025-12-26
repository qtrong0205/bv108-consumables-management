import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MOCK_MEDICAL_SUPPLIES } from '@/data/mockData';

const COLORS = ['#0066CC', '#00A86B', '#FFB020', '#E53935', '#7B61FF', '#00BCD4', '#FF9800', '#9C27B0'];

export default function InventoryByGroupChart() {
    // Tính tổng số lượng tồn theo nhóm
    const groupData = MOCK_MEDICAL_SUPPLIES.reduce((acc, item) => {
        const existing = acc.find(g => g.name === item.tenNhom);
        if (existing) {
            existing.value += item.soLuongTon;
        } else {
            acc.push({ name: item.tenNhom, value: item.soLuongTon });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    // Sắp xếp theo số lượng giảm dần
    groupData.sort((a, b) => b.value - a.value);

    return (
        <Card className="bg-neutral border-border">
            <CardHeader>
                <CardTitle className="text-foreground text-base">Tồn kho theo nhóm vật tư</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={groupData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) =>
                                `${name.length > 10 ? name.substring(0, 10) + '...' : name} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={false}
                        >
                            {groupData.map((_, index) => (
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
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
