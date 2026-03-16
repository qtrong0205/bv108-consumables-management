import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Funnel } from 'lucide-react';
import { MedicalSupply } from '@/types';

const BASE_MONTHLY_USAGE = [
    { month: 'T1', usage: 420 },
    { month: 'T2', usage: 380 },
    { month: 'T3', usage: 450 },
    { month: 'T4', usage: 490 },
    { month: 'T5', usage: 520 },
    { month: 'T6', usage: 480 },
    { month: 'T7', usage: 510 },
    { month: 'T8', usage: 540 },
    { month: 'T9', usage: 500 },
    { month: 'T10', usage: 530 },
    { month: 'T11', usage: 560 },
    { month: 'T12', usage: 590 },
];

interface UsageChartProps {
    supplies: MedicalSupply[];
}

export default function UsageChart({ supplies }: UsageChartProps) {
    const [selectedGroup, setSelectedGroup] = useState('all');

    const groupNames = useMemo(() => {
        return Array.from(new Set(supplies.map(item => item.tenNhom || 'Chưa phân loại'))).sort((a, b) => a.localeCompare(b));
    }, [supplies]);

    const data = useMemo(() => {
        if (selectedGroup === 'all' || supplies.length === 0) {
            return BASE_MONTHLY_USAGE;
        }

        const totalUsage = supplies.reduce((sum, item) => sum + (item.soLuongTieuHao || 0), 0);
        const selectedUsage = supplies
            .filter(item => (item.tenNhom || 'Chưa phân loại') === selectedGroup)
            .reduce((sum, item) => sum + (item.soLuongTieuHao || 0), 0);

        const ratio = totalUsage > 0 ? selectedUsage / totalUsage : 0;

        return BASE_MONTHLY_USAGE.map(point => ({
            ...point,
            usage: Math.round(point.usage * ratio),
        }));
    }, [selectedGroup, supplies]);

    const lineName = selectedGroup === 'all' ? 'Vật tư đã sử dụng' : `Vật tư đã sử dụng - ${selectedGroup}`;

    return (
        <Card className="bg-neutral border-border">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-foreground">Xu hướng sử dụng theo tháng</CardTitle>
                <div className="flex items-center gap-2">
                    <Funnel className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="w-[240px] bg-neutral text-foreground border-border h-9">
                            <SelectValue placeholder="Lọc theo nhóm vật tư" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả nhóm vật tư</SelectItem>
                            {groupNames.map((group) => (
                                <SelectItem key={group} value={group}>
                                    {group}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 90%)" />
                        <XAxis
                            dataKey="month"
                            stroke="hsl(210, 10%, 30%)"
                            style={{ fontSize: '12px' }}
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
                        />
                        <Legend />
                        <Bar
                            dataKey="usage"
                            fill="hsl(218, 100%, 40%)"
                            radius={[4, 4, 0, 0]}
                            name={lineName}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
