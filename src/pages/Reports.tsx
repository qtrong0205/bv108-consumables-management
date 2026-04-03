import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompareSuppliesTab from '@/components/reports/CompareSuppliesTab';
import { FileDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

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

const reportsUiCache = { activeTab: 'summary' };

export default function Reports() {
    const [dateRange, setDateRange] = useState('last-month');
    const [category, setCategory] = useState('all');
    const [supplier, setSupplier] = useState('all');
    const [activeTab, setActiveTab] = useState(reportsUiCache.activeTab);
    const { toast } = useToast();
    const pieChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);
    const supplierTableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        reportsUiCache.activeTab = activeTab;
    }, [activeTab]);

    const escapeHtml = (input: string): string =>
        input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const generateCategoryChartHtml = (): string => {
        const rows = categoryData
            .map(
                (item) =>
                    `<tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td style="text-align: right;">${item.value.toLocaleString('vi-VN')}</td>
                        <td style="text-align: right;">${((item.value / categoryData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%</td>
                    </tr>`
            )
            .join('');

        return `
            <h3 style="margin-top: 20px; margin-bottom: 12px;">Sử dụng theo danh mục</h3>
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
                <thead>
                    <tr style="background: #0f3a68; color: white;">
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Danh mục</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Số lượng</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Tỷ lệ</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    };

    const generateSupplierChartHtml = (): string => {
        const rows = supplierData
            .map(
                (item) =>
                    `<tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td style="text-align: right;">${item.orders}</td>
                        <td style="text-align: right;">$${item.value.toLocaleString()}</td>
                    </tr>`
            )
            .join('');

        return `
            <h3 style="margin-top: 20px; margin-bottom: 12px;">Đơn hàng theo nhà cung cấp</h3>
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
                <thead>
                    <tr style="background: #0f3a68; color: white;">
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Nhà cung cấp</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Số đơn hàng</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Giá trị</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    };

    const generateSupplierPerformanceHtml = (): string => {
        const rows = supplierData
            .map(
                (item) =>
                    `<tr>
                        <td style="background: #f3f4f6;">${escapeHtml(item.name)}</td>
                        <td style="text-align: center;">${item.orders}</td>
                        <td style="text-align: right;">$${item.value.toLocaleString()}</td>
                        <td style="text-align: center;">7-10 ngày</td>
                        <td style="text-align: center; color: #16a34a; font-weight: bold;">95%</td>
                    </tr>`
            )
            .join('');

        return `
            <h3 style="margin-top: 20px; margin-bottom: 12px;">Tổng hợp hiệu suất nhà cung cấp</h3>
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
                <thead>
                    <tr style="background: #0f3a68; color: white;">
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Nhà cung cấp</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Tổng đơn hàng</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Tổng giá trị</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Thời gian giao TB</th>
                        <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Tỷ lệ đúng hạn</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    };

    const handleExportPdf = () => {
        const categoryChart = generateCategoryChartHtml();
        const supplierChart = generateSupplierChartHtml();
        const performanceTable = generateSupplierPerformanceHtml();

        const html = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Báo cáo Danh sách vật tư</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            padding: 20px;
                            color: #1f2937;
                            line-height: 1.6;
                        }
                        h1 {
                            text-align: center;
                            margin-bottom: 8px;
                            font-size: 24px;
                            color: #0f3a68;
                        }
                        h2 {
                            margin-top: 24px;
                            margin-bottom: 12px;
                            font-size: 16px;
                            color: #0f3a68;
                            border-bottom: 2px solid #0f3a68;
                            padding-bottom: 8px;
                        }
                        h3 {
                            margin-top: 16px;
                            margin-bottom: 8px;
                            font-size: 14px;
                            color: #0f3a68;
                        }
                        .metadata {
                            text-align: center;
                            color: #6b7280;
                            margin-bottom: 20px;
                            font-size: 12px;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin-bottom: 16px;
                        }
                        th, td {
                            border: 1px solid #d1d5db;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background: #0f3a68;
                            color: white;
                            font-weight: bold;
                        }
                        tbody tr:nth-child(even) {
                            background: #f9fafb;
                        }
                        .page-break {
                            page-break-after: always;
                        }
                    </style>
                </head>
                <body>
                    <h1>BÁO CÁO DANH SÁCH VẬT TƯ</h1>
                    <div class="metadata">
                        <p>Ngày báo cáo: ${new Date().toLocaleDateString('vi-VN')}</p>
                    </div>

                    <h2>Phân tích tổng hợp</h2>

                    ${categoryChart}
                    ${supplierChart}
                    ${performanceTable}

                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>Báo cáo được tạo tự động bởi hệ thống quản lý vật tư y tế</p>
                        <p>${new Date().toLocaleString('vi-VN')}</p>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({
                title: "Lỗi",
                description: "Không thể mở cửa sổ in PDF. Hãy kiểm tra popup blocker.",
                variant: "destructive",
            });
            return;
        }

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);

        toast({
            title: "Xuất PDF thành công",
            description: "Vui lòng hoàn thành quá trình in để lưu file PDF",
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Báo cáo</h1>
                    <p className="text-muted-foreground">Phân tích dữ liệu tồn kho và mua sắm</p>
                </div>
                {activeTab === 'summary' && (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                            onClick={handleExportPdf}
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
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-2">
                    <TabsTrigger value="summary">Tổng hợp</TabsTrigger>
                    <TabsTrigger value="compare">So sánh</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
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
                        <Card ref={pieChartRef} className="bg-neutral border-border">
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
                            <div className="overflow-x-auto" ref={supplierTableRef}>
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
                </TabsContent>

                <TabsContent value="compare">
                    <CompareSuppliesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
