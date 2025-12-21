import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const categoryData = [
    { name: 'Đồ bảo hộ', value: 450 },
    { name: 'Vật tư tiêm', value: 320 },
    { name: 'Chăm sóc vết thương', value: 280 },
    { name: 'Vật tư truyền dịch', value: 210 },
    { name: 'Khử trùng', value: 180 },
];

const supplierData = [
    { name: 'Công ty Vật tư Y tế', orders: 15, value: 45000 },
    { name: 'Công ty Y tế Sức khỏe', orders: 12, value: 38000 },
    { name: 'Công ty Chăm sóc Tĩnh mạch', orders: 8, value: 28000 },
    { name: 'Công ty Vệ sinh Y tế', orders: 6, value: 18000 },
];

const COLORS = ['hsl(218, 100%, 40%)', 'hsl(218, 90%, 52%)', 'hsl(148, 48%, 40%)', 'hsl(38, 90%, 50%)', 'hsl(210, 10%, 60%)'];

export default function Reports() {
    const [dateRange, setDateRange] = useState('last-month');
    const [category, setCategory] = useState('all');
    const [supplier, setSupplier] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Báo cáo</h1>
                    <p className="text-muted-foreground">Phân tích dữ liệu tồn kho và mua sắm</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                    >
                        <FileDown className="w-4 h-4 mr-2" strokeWidth={2} />
                        Xuất PDF
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                    >
                        <FileDown className="w-4 h-4 mr-2" strokeWidth={2} />
                        Xuất CSV
                    </Button>
                </div>
            </div>

            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateRange" className="text-foreground">Khoảng thời gian</Label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger id="dateRange" className="bg-neutral text-foreground border-border">
                                    <Calendar className="w-4 h-4 mr-2" strokeWidth={2} />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last-week">Tuần trước</SelectItem>
                                    <SelectItem value="last-month">Tháng trước</SelectItem>
                                    <SelectItem value="last-quarter">Quý trước</SelectItem>
                                    <SelectItem value="last-year">Năm trước</SelectItem>
                                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-foreground">Danh mục</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category" className="bg-neutral text-foreground border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                                    <SelectItem value="ppe">Đồ bảo hộ</SelectItem>
                                    <SelectItem value="injection">Vật tư tiêm</SelectItem>
                                    <SelectItem value="wound">Chăm sóc vết thương</SelectItem>
                                    <SelectItem value="iv">Vật tư truyền dịch</SelectItem>
                                    <SelectItem value="disinfection">Khử trùng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplier" className="text-foreground">Nhà cung cấp</Label>
                            <Select value={supplier} onValueChange={setSupplier}>
                                <SelectTrigger id="supplier" className="bg-neutral text-foreground border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                                    <SelectItem value="medsupply">Công ty Vật tư Y tế</SelectItem>
                                    <SelectItem value="healthtech">Công ty Y tế Sức khỏe</SelectItem>
                                    <SelectItem value="veincare">Công ty Chăm sóc Tĩnh mạch</SelectItem>
                                    <SelectItem value="cleanmed">Công ty Vệ sinh Y tế</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-neutral border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Sử dụng theo danh mục</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="hsl(218, 100%, 40%)"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
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
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-neutral border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Đơn hàng theo nhà cung cấp</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={supplierData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 90%)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(210, 10%, 30%)"
                                    style={{ fontSize: '12px' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis stroke="hsl(210, 10%, 30%)" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(0, 0%, 100%)',
                                        border: '1px solid hsl(210, 14%, 90%)',
                                        borderRadius: '8px',
                                        color: 'hsl(210, 10%, 18%)',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="orders" fill="hsl(218, 100%, 40%)" name="Số đơn hàng" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Tổng hợp hiệu suất nhà cung cấp</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-primary text-primary-foreground">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Nhà cung cấp</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Tổng đơn hàng</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Tổng giá trị</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Thời gian giao TB</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Tỷ lệ đúng hạn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {supplierData.map((supplier, index) => (
                                    <tr key={index} className="hover:bg-tertiary transition-colors">
                                        <td className="px-6 py-4 text-sm text-foreground font-medium">{supplier.name}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{supplier.orders}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">${supplier.value.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">7-10 ngày</td>
                                        <td className="px-6 py-4 text-sm text-success font-medium">95%</td>
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
