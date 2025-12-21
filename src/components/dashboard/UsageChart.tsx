import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
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

export default function UsageChart() {
    return (
        <Card className="bg-neutral border-border">
            <CardHeader>
                <CardTitle className="text-foreground">Xu hướng sử dụng theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
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
                        <Line
                            type="monotone"
                            dataKey="usage"
                            stroke="hsl(218, 100%, 40%)"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(218, 100%, 40%)', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Vật tư đã sử dụng"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
