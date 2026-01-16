import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IVatTuDuTru } from "@/data/mockData";
import { TabsContent } from "@radix-ui/react-tabs"
import { Calculator, CheckCircle2, Search } from "lucide-react"
import React from "react"

interface IForecastTableProps {
    totalForecast: number;
    totalOrder: number;
    totalValue: number;
    approvedCount: number;
    filteredData: IVatTuDuTru[];
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    handleRowClick: (item: IVatTuDuTru) => void;
    getStatusBadge: (stt: number) => React.ReactNode;
    handleForecastChange: (stt: number, value: string) => void;
    handleForecastFocus: (stt: number, value: number) => void;
    handleForecastBlur: (stt: number, newValue: number) => void;
}

const ForecastTable = ({
    totalForecast,
    totalOrder,
    totalValue,
    approvedCount,
    filteredData,
    searchTerm,
    setSearchTerm,
    handleRowClick,
    getStatusBadge,
    handleForecastChange,
    handleForecastFocus,
    handleForecastBlur,
}: IForecastTableProps) => {
    return (
        <TabsContent value="forecast" className="space-y-6">
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số lượng dự trù</p>
                                <p className="text-2xl font-semibold text-foreground">{totalForecast.toLocaleString('vi-VN')}</p>
                            </div>
                            <Calculator className="w-8 h-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số gói hàng</p>
                                <p className="text-2xl font-semibold text-foreground">{totalOrder.toLocaleString('vi-VN')}</p>
                            </div>
                            <Calculator className="w-8 h-8 text-secondary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng giá trị ước tính</p>
                                <p className="text-2xl font-semibold text-foreground">{totalValue.toLocaleString('vi-VN')}đ</p>
                            </div>
                            <Calculator className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tiến độ phê duyệt</p>
                                <p className="text-2xl font-semibold text-foreground">
                                    {approvedCount}/{filteredData.length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${filteredData.length > 0 ? (approvedCount / filteredData.length) * 100 : 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bộ lọc */}
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Tìm kiếm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2} />
                        <Input
                            type="search"
                            placeholder="Tìm theo tên, mã vật tư hoặc nhà thầu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-neutral text-foreground border-border"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bảng dữ liệu */}
            <Card className="bg-neutral border-border">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px]">
                            <thead className="bg-primary text-primary-foreground">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">STT</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Mã hiệu</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Quy cách</th>
                                    <th className="px-3 py-3 text-right text-xs font-medium whitespace-nowrap">Đơn giá</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Xuất</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Nhập</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Tồn</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà thầu</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600">Dự trù</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600">Gọi hàng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredData.map((item) => (
                                    <tr
                                        key={item.stt}
                                        className="hover:bg-tertiary transition-colors cursor-pointer"
                                        onClick={() => handleRowClick(item)}
                                    >
                                        <td className="px-3 py-3 text-xs text-foreground text-center">{item.stt}</td>
                                        <td className="px-3 py-3 text-xs font-mono text-foreground whitespace-nowrap">{item.maVtytCu}</td>
                                        <td className="px-3 py-3 text-sm text-foreground">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <p className="font-medium truncate flex-1 min-w-0" title={item.tenVtytBv}>{item.tenVtytBv}</p>
                                                {getStatusBadge(item.stt)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{item.maHieu}</td>
                                        <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{item.hangSx}</td>
                                        <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">
                                            {item.quyCach} ({item.slTrongQuyCach} {item.donViTinh})
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-right font-medium whitespace-nowrap">
                                            {item.donGia.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                            {item.slXuat}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                            {item.slNhap}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                            <Badge variant={item.slTon < 50 ? "destructive" : "secondary"} className="text-xs">
                                                {item.slTon}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground">
                                            <div className="max-w-[100px] truncate" title={item.nhaThau}>
                                                {item.nhaThau}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 bg-green-50 dark:bg-green-950/30" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.duTru}
                                                onChange={(e) => handleForecastChange(item.stt, e.target.value)}
                                                onFocus={() => handleForecastFocus(item.stt, item.duTru)}
                                                onBlur={(e) => handleForecastBlur(item.stt, parseInt(e.target.value) || 0)}
                                                className="w-20 h-8 text-xs text-center bg-white dark:bg-neutral border-green-300 focus:border-green-500"
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center font-semibold bg-green-50 dark:bg-green-950/30">
                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                {item.goiHang}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-tertiary border-t-2 border-border">
                                <tr>
                                    <td colSpan={11} className="px-3 py-3 text-sm font-semibold text-foreground text-right">
                                        Tổng cộng:
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-foreground text-center bg-green-100 dark:bg-green-950/50">
                                        {totalForecast}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-foreground text-center bg-green-100 dark:bg-green-950/50">
                                        {totalOrder}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {filteredData.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Không tìm thấy vật tư nào
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    )
}

export default ForecastTable