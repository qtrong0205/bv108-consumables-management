import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, Funnel } from 'lucide-react';
import { MedicalSupply, OrderHistory } from '@/types';
import { Button } from '@/components/ui/button';

interface UsageChartProps {
    supplies: MedicalSupply[];
    orderHistory: OrderHistory[];
}

type MonthlyOrderTrendPoint = {
    month: string;
    orderQuantity: number;
};

const roundUpAxis = (value: number): number => {
    if (value <= 0) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const step = magnitude / 2;
    return Math.ceil(value / step) * step;
};

const parseDate = (value?: string | Date): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export default function UsageChart({ supplies, orderHistory }: UsageChartProps) {
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const groupNames = useMemo(() => {
        return Array.from(new Set(supplies.map(item => item.tenNhom || 'Chưa phân loại'))).sort((a, b) => a.localeCompare(b));
    }, [supplies]);

    const supplyGroupMap = useMemo(() => {
        const byMaVtyt = new Map<string, string>();
        const byId = new Map<string, string>();

        supplies.forEach((supply) => {
            const groupName = supply.tenNhom || 'Chưa phân loại';
            byMaVtyt.set((supply.maVtyt || '').trim().toLowerCase(), groupName);
            byId.set(String(supply.id), groupName);
        });

        return { byMaVtyt, byId };
    }, [supplies]);

    const yearBounds = useMemo(() => {
        const years = orderHistory
            .map((item) => parseDate(item.ngayDatHang)?.getFullYear())
            .filter((year): year is number => typeof year === 'number');

        if (years.length === 0) {
            const nowYear = new Date().getFullYear();
            return { minYear: nowYear, maxYear: nowYear };
        }

        return {
            minYear: Math.min(...years),
            maxYear: Math.max(...years),
        };
    }, [orderHistory]);

    const data = useMemo<MonthlyOrderTrendPoint[]>(() => {
        const monthlyTotals = Array(12).fill(0) as number[];

        orderHistory.forEach((item) => {
            const date = parseDate(item.ngayDatHang);
            if (!date || date.getFullYear() !== selectedYear) {
                return;
            }

            if (selectedGroup !== 'all') {
                const maVtytKey = (item.maVtytCu || '').trim().toLowerCase();
                const maQuanLyKey = (item.maQuanLy || '').trim();
                const groupName = supplyGroupMap.byMaVtyt.get(maVtytKey)
                    || supplyGroupMap.byId.get(maQuanLyKey)
                    || 'Chưa phân loại';

                if (groupName !== selectedGroup) {
                    return;
                }
            }

            const monthIndex = date.getMonth();
            monthlyTotals[monthIndex] += item.dotGoiHang || 0;
        });

        return monthlyTotals.map((value, index) => ({
            month: `T${index + 1}`,
            orderQuantity: value,
        }));
    }, [orderHistory, selectedYear, selectedGroup, supplyGroupMap]);

    const totalYearOrders = useMemo(() => data.reduce((sum, item) => sum + item.orderQuantity, 0), [data]);

    const yAxisMax = useMemo(() => {
        const allMonthlyTotals = Array(12).fill(0) as number[];

        orderHistory.forEach((item) => {
            const date = parseDate(item.ngayDatHang);
            if (!date) return;
            const monthIndex = date.getMonth();
            allMonthlyTotals[monthIndex] += item.dotGoiHang || 0;
        });

        const maxValue = Math.max(...allMonthlyTotals, 0);
        return roundUpAxis(maxValue);
    }, [orderHistory]);

    return (
        <Card className="bg-neutral border-border">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-foreground">Xu hướng đặt hàng theo tháng</CardTitle>
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
                <div className="text-sm font-medium text-foreground text-center mb-3">Năm {selectedYear}</div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setSelectedYear((prev) => prev - 1)}
                        disabled={selectedYear <= yearBounds.minYear}
                        aria-label="Năm trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

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
                                domain={[0, yAxisMax]}
                                allowDecimals={false}
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
                                dataKey="orderQuantity"
                                fill="hsl(218, 100%, 40%)"
                                radius={[4, 4, 0, 0]}
                                name="Số lượng đặt hàng"
                            />
                        </BarChart>
                    </ResponsiveContainer>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setSelectedYear((prev) => prev + 1)}
                        disabled={selectedYear >= yearBounds.maxYear}
                        aria-label="Năm sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Tổng số lượng đặt trong năm: <strong className="text-foreground">{totalYearOrders.toLocaleString('vi-VN')}</strong>
                </p>
            </CardContent>
        </Card>
    );
}
