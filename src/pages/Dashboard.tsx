import { useEffect, useState, useMemo } from 'react';
import { useSupplies } from '@/hooks/use-supplies';
import { useOrder } from '@/context/OrderContext';
import { useHoaDonUBot } from '@/hooks/use-hoadon-ubot';
import { apiService, ApiForecastApproval } from '@/services/api';
import { MedicalSupply, HoaDonUBot } from '@/types';
import { 
    Package, AlertTriangle, ShoppingCart, CheckCircle, 
    TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, 
    Percent, Filter, RefreshCw, X, FileText, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';

// Helper functions for Circular 04 hierarchy codes
const parseTypeNameParts = (typeName?: string): string[] => {
    if (!typeName) return [];
    return typeName.split('-').map(p => p.trim()).filter(Boolean);
};

const getMãCấp1 = (item: MedicalSupply): string => {
    if (item.maNhom) return item.maNhom.trim();
    const parts = parseTypeNameParts(item.typeName);
    return parts.length >= 1 ? parts[0] : '';
};

const getMãCấp2 = (item: MedicalSupply): string => {
    const maCấp1 = getMãCấp1(item);
    if (!maCấp1) return '';
    const parts = parseTypeNameParts(item.typeName);
    if (parts.length >= 2) {
        const part1 = parts[1].split(' ')[0];
        return `${maCấp1}-${part1}`;
    }
    return '';
};

const getMãCấp3 = (item: MedicalSupply): string => {
    const maCấp1 = getMãCấp1(item);
    if (!maCấp1) return '';
    const parts = parseTypeNameParts(item.typeName);
    if (parts.length >= 3) {
        const part1 = parts[1].split(' ')[0];
        const part2 = parts[2].split(' ')[0];
        return `${maCấp1}-${part1}-${part2}`;
    }
    return '';
};

export default function Dashboard() {
    // 1. Fetching core data hooks
    const { supplies, loading: loadingSupplies } = useSupplies(1, 1500); // Retrieve all supplies
    const { orderHistory, approvedOrders, loadingOrders } = useOrder();
    const { hoaDons, loading: loadingInvoices, refetch: refetchInvoices } = useHoaDonUBot();
    const supplyGroups = useMemo(() => {
        const list = supplies.map(item => item.tenNhom).filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
    }, [supplies]);

    // 2. Local state variables
    const [forecastApprovals, setForecastApprovals] = useState<ApiForecastApproval[]>([]);
    const [loadingForecast, setLoadingForecast] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(true); // Collapsible on mobile

    // Filter states
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [selectedTypeLevel1, setSelectedTypeLevel1] = useState<string>('all');
    const [selectedTypeLevel2, setSelectedTypeLevel2] = useState<string>('all');
    const [selectedTypeLevel3, setSelectedTypeLevel3] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');

    // Fetch forecast approvals for selected time period
    useEffect(() => {
        const fetchForecastApprovals = async () => {
            try {
                setLoadingForecast(true);
                const monthVal = selectedMonth === 'all' ? new Date().getMonth() + 1 : parseInt(selectedMonth);
                const yearVal = selectedYear === 'all' ? new Date().getFullYear() : parseInt(selectedYear);
                const res = await apiService.getForecastApprovals(monthVal, yearVal);
                setForecastApprovals(res.data || []);
            } catch (e) {
                console.error('Error fetching forecast approvals:', e);
            } finally {
                setLoadingForecast(false);
            }
        };
        fetchForecastApprovals();
    }, [selectedMonth, selectedYear]);

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 3. Level filters options derivation from current supplies
    const level1Options = useMemo(() => {
        const list = supplies.map(item => getMãCấp1(item)).filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
    }, [supplies]);

    const level2Options = useMemo(() => {
        const list = supplies
            .filter(item => selectedTypeLevel1 === 'all' || getMãCấp1(item) === selectedTypeLevel1)
            .map(item => getMãCấp2(item))
            .filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
    }, [supplies, selectedTypeLevel1]);

    const level3Options = useMemo(() => {
        const list = supplies
            .filter(item => selectedTypeLevel2 === 'all' || getMãCấp2(item) === selectedTypeLevel2)
            .map(item => getMãCấp3(item))
            .filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
    }, [supplies, selectedTypeLevel2]);

    const supplierOptions = useMemo(() => {
        const list = supplies.map(item => item.nhaThau).filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
    }, [supplies]);

    // Reset child levels when parent changes
    useEffect(() => {
        setSelectedTypeLevel2('all');
        setSelectedTypeLevel3('all');
    }, [selectedTypeLevel1]);

    useEffect(() => {
        setSelectedTypeLevel3('all');
    }, [selectedTypeLevel2]);

    // Reset filters helper
    const handleResetFilters = () => {
        setSelectedGroup('all');
        setSelectedTypeLevel1('all');
        setSelectedTypeLevel2('all');
        setSelectedTypeLevel3('all');
        setSelectedSupplier('all');
        setSelectedMonth('all');
        setSelectedYear('all');
    };

    // 4. Filtering Logic for Supplies
    const filteredSupplies = useMemo(() => {
        return supplies.filter(item => {
            const matchGroup = selectedGroup === 'all' || item.tenNhom === selectedGroup;
            const matchLevel1 = selectedTypeLevel1 === 'all' || getMãCấp1(item) === selectedTypeLevel1;
            const matchLevel2 = selectedTypeLevel2 === 'all' || getMãCấp2(item) === selectedTypeLevel2;
            const matchLevel3 = selectedTypeLevel3 === 'all' || getMãCấp3(item) === selectedTypeLevel3;
            const matchSupplier = selectedSupplier === 'all' || item.nhaThau === selectedSupplier;
            return matchGroup && matchLevel1 && matchLevel2 && matchLevel3 && matchSupplier;
        });
    }, [supplies, selectedGroup, selectedTypeLevel1, selectedTypeLevel2, selectedTypeLevel3, selectedSupplier]);

    // Warning state evaluator
    const getWarningDetails = (item: MedicalSupply) => {
        const periodDays = 30; // standard month period
        const tonCuoiKy = item.soLuongTon;
        const tonKhoMin = item.soLuongToiThieu;
        const xuatTrongKy = item.soLuongTieuHao;
        const dailyUsage = xuatTrongKy / periodDays;
        const doi = dailyUsage > 0 ? tonCuoiKy / dailyUsage : Number.POSITIVE_INFINITY;
        
        if (tonCuoiKy === 0) {
            return { label: "Gọi hàng khẩn cấp", tone: "destructive" };
        }
        if (doi <= 7) {
            return { label: "Nguy cơ hết trong 7 ngày", tone: "destructive" };
        }
        if (doi <= 30) {
            return { label: "Cần gọi hàng", tone: "warning" };
        }
        if (tonCuoiKy < tonKhoMin) {
            return { label: "Dưới định mức", tone: "warning" };
        }
        return { label: "Theo dõi", tone: "success" };
    };

    // 5. Calculations for 9 KPI Cards
    const kpis = useMemo(() => {
        // Total Items
        const totalItemsCount = filteredSupplies.length;

        // Stock Warning items
        const warningItems = filteredSupplies.filter(item => {
            const warn = getWarningDetails(item);
            return warn.label !== "Theo dõi";
        });

        // Pending Orders: Filtered matching pending list from OrderContext
        const pendingCount = approvedOrders.filter(order => {
            const key = (order.maQuanLy || '').trim();
            const cu = (order.maVtytCu || '').trim();
            return filteredSupplies.some(s => s.maVtyt === key || s.maVtyt === cu || s.id === key);
        }).length;

        // Submitted Forecast requests
        const submittedRequests = forecastApprovals.filter(req => {
            const matchStatus = req.status === 'submitted' || req.status === 'pending';
            const matchSupply = filteredSupplies.some(s => s.maVtyt === req.maQuanLy || s.id === req.maQuanLy);
            return matchStatus && matchSupply;
        }).length;

        // Values totals
        let totalInventoryValue = 0;
        let totalImportValue = 0;
        let totalExportValue = 0;
        let belowMinStockCount = 0;
        let totalTenderQty = 0;
        let totalTenderImportedQty = 0;

        filteredSupplies.forEach(item => {
            const price = item.donGia || 0;
            totalInventoryValue += (item.soLuongTon || 0) * price;
            totalImportValue += (item.nhapTrongKy || 0) * price;
            totalExportValue += (item.soLuongTieuHao || 0) * price;
            
            if (item.soLuongTon < item.soLuongToiThieu) {
                belowMinStockCount++;
            }

            const thauQty = parseFloat(item.tongThau) || 0;
            const importedQty = item.tongNhap || 0;
            if (thauQty > 0) {
                totalTenderQty += thauQty;
                totalTenderImportedQty += importedQty;
            }
        });

        const tenderExecutionRate = totalTenderQty > 0 
            ? (totalTenderImportedQty / totalTenderQty) * 100 
            : 0;

        return {
            totalItems: totalItemsCount,
            lowStock: warningItems.length,
            pendingOrders: pendingCount,
            procurementRequests: submittedRequests,
            inventoryValue: totalInventoryValue,
            importValue: totalImportValue,
            exportValue: totalExportValue,
            belowMinStock: belowMinStockCount,
            tenderRate: tenderExecutionRate
        };
    }, [filteredSupplies, approvedOrders, forecastApprovals]);

    // 6. Bottom tables lists derivation
    const lowStockAlertItems = useMemo(() => {
        return filteredSupplies
            .map(item => ({
                ...item,
                warning: getWarningDetails(item)
            }))
            .filter(item => item.warning.label !== "Theo dõi")
            .sort((a, b) => a.soLuongTon - b.soLuongTon)
            .slice(0, 15);
    }, [filteredSupplies]);

    const nearExhaustedTenders = useMemo(() => {
        return filteredSupplies
            .map(item => {
                const limit = parseFloat(item.tongThau) || 0;
                const progress = limit > 0 ? ((item.tongNhap || 0) / limit) * 100 : 0;
                return { ...item, progress, limit };
            })
            .filter(item => item.limit > 0 && item.progress >= 80)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 15);
    }, [filteredSupplies]);

    const faultyInvoicesList = useMemo(() => {
        // Filter invoices matching selected supplier (if any) and having non-VALID status
        return hoaDons
            .filter(inv => {
                const matchStatus = inv.trangThaiHoaDon !== 'VALID';
                const matchSupplier = selectedSupplier === 'all' || 
                    inv.congTy.toLowerCase().includes(selectedSupplier.toLowerCase()) ||
                    (supplierOptions.some(s => s.toLowerCase().includes(inv.congTy.toLowerCase())) && selectedSupplier === 'all');
                return matchStatus && matchSupplier;
            })
            .sort((a, b) => new Date(b.ngayHoaDon).getTime() - new Date(a.ngayHoaDon).getTime());
    }, [hoaDons, selectedSupplier, supplierOptions]);

    // 7. Visualizations charts calculations
    // (a) Monthly Usage trend line
    const usageTrendData = useMemo(() => {
        const year = selectedYear === 'all' ? new Date().getFullYear() : parseInt(selectedYear);
        const monthlyTotals = Array(12).fill(0);

        orderHistory.forEach(order => {
            const date = order.ngayDatHang ? new Date(order.ngayDatHang) : null;
            if (!date || Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
                return;
            }
            
            // Check filters
            const orderKey = (order.maQuanLy || '').trim();
            const orderCu = (order.maVtytCu || '').trim();
            const isMatch = filteredSupplies.some(s => s.maVtyt === orderKey || s.maVtyt === orderCu || s.id === orderKey);
            if (!isMatch && filteredSupplies.length < supplies.length) {
                return; // filter items if selected
            }

            const monthIndex = date.getMonth();
            monthlyTotals[monthIndex] += order.dotGoiHang || 0;
        });

        return monthlyTotals.map((value, index) => ({
            month: `T${index + 1}`,
            value: value
        }));
    }, [orderHistory, selectedYear, filteredSupplies, supplies]);

    // (b) Top 10 Consumables horizontal bar
    const topConsumablesData = useMemo(() => {
        return [...filteredSupplies]
            .sort((a, b) => (b.soLuongTieuHao || 0) - (a.soLuongTieuHao || 0))
            .slice(0, 10)
            .map(item => ({
                name: item.tenVtyt.length > 20 ? `${item.tenVtyt.substring(0, 20)}...` : item.tenVtyt,
                fullName: item.tenVtyt,
                volume: item.soLuongTieuHao || 0,
                unit: item.donViTinh || 'Cái'
            }));
    }, [filteredSupplies]);

    // (c) Financial comparison chart grouped bar
    const financialComparisonData = useMemo(() => {
        // Group values by top 5 groups to display clean values
        const groupsMap: Record<string, { import: number; export: number; stock: number }> = {};
        
        filteredSupplies.forEach(item => {
            const groupName = item.tenNhom || 'Khác';
            const price = item.donGia || 0;
            if (!groupsMap[groupName]) {
                groupsMap[groupName] = { import: 0, export: 0, stock: 0 };
            }
            groupsMap[groupName].import += (item.nhapTrongKy || 0) * price;
            groupsMap[groupName].export += (item.soLuongTieuHao || 0) * price;
            groupsMap[groupName].stock += (item.soLuongTon || 0) * price;
        });

        return Object.entries(groupsMap)
            .map(([name, val]) => ({
                name: name.length > 15 ? `${name.substring(0, 15)}...` : name,
                fullName: name,
                'Nhập trong kỳ': val.import,
                'Xuất trong kỳ': val.export,
                'Tồn cuối kỳ': val.stock
            }))
            .sort((a, b) => b['Tồn cuối kỳ'] - a['Tồn cuối kỳ'])
            .slice(0, 5); // show top 5 group values
    }, [filteredSupplies]);

    const formatVND = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    };

    const isLoading = loadingSupplies || loadingOrders || loadingInvoices || loadingForecast;

    return (
        <div className="p-4 lg:p-8 space-y-6 bg-tertiary min-h-screen text-foreground">
            {/* Title Header with responsive stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Tổng quan Khoa Bệnh Viện TWQĐ 108</h1>
                    <p className="text-muted-foreground mt-1">Hệ thống phân tích, đối chiếu & điều phối vật tư tiêu hao y tế</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="lg:hidden flex items-center gap-2 border-border"
                    >
                        <Filter className="w-4 h-4" />
                        {isFilterOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 border-border bg-neutral hover:bg-muted"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Đặt lại bộ lọc
                    </Button>
                </div>
            </div>

            {/* Dashboard Container: Left Sidebar Filters + Right Main Content */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* 1. Filter Sidebar Panel */}
                <div className={`w-full lg:w-80 flex-shrink-0 space-y-4 transition-all duration-300 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                    <Card className="bg-neutral border-border sticky top-4 shadow-sm">
                        <CardHeader className="pb-4 border-b border-border">
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                                <Filter className="w-5 h-5 text-primary" />
                                Bộ lọc chỉ số & dữ liệu
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* Filter: Nhóm vật tư */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nhóm vật tư</label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                >
                                    <option value="all">Tất cả nhóm vật tư</option>
                                    {supplyGroups.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter: Mã cấp 1 */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã cấp 1 (Circular 04)</label>
                                <select
                                    value={selectedTypeLevel1}
                                    onChange={(e) => setSelectedTypeLevel1(e.target.value)}
                                    className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                >
                                    <option value="all">Tất cả mã cấp 1</option>
                                    {level1Options.map(l1 => (
                                        <option key={l1} value={l1}>{l1}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter: Mã cấp 2 */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã cấp 2</label>
                                <select
                                    value={selectedTypeLevel2}
                                    disabled={selectedTypeLevel1 === 'all'}
                                    onChange={(e) => setSelectedTypeLevel2(e.target.value)}
                                    className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 text-foreground"
                                >
                                    <option value="all">Tất cả mã cấp 2</option>
                                    {level2Options.map(l2 => (
                                        <option key={l2} value={l2}>{l2}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter: Mã cấp 3 */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã cấp 3</label>
                                <select
                                    value={selectedTypeLevel3}
                                    disabled={selectedTypeLevel2 === 'all'}
                                    onChange={(e) => setSelectedTypeLevel3(e.target.value)}
                                    className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 text-foreground"
                                >
                                    <option value="all">Tất cả mã cấp 3</option>
                                    {level3Options.map(l3 => (
                                        <option key={l3} value={l3}>{l3}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter: Nhà cung cấp */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nhà cung cấp</label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                >
                                    <option value="all">Tất cả nhà thầu</option>
                                    {supplierOptions.map(sup => (
                                        <option key={sup} value={sup}>{sup}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter: Thời gian */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tháng</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full bg-tertiary border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    >
                                        <option value="all">Cả năm</option>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>T{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Năm</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full bg-tertiary border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                        <option value="2027">2027</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6 min-w-0">
                    {/* Loading State Spinner */}
                    {isLoading && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium text-sm">
                            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                            Đang xử lý & phân tích dữ liệu kho y tế...
                        </div>
                    )}

                    {/* 2. Top row: 9 KPI cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                        {/* KPI 1: Tổng số vật tư */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Tổng vật tư kho</span>
                                    <h3 className="text-2xl font-bold text-foreground">{kpis.totalItems.toLocaleString('vi-VN')}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                                    <Package className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 2: Vật tư sắp hết */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Vật tư sắp hết</span>
                                    <h3 className="text-2xl font-bold text-amber-600">{kpis.lowStock}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 3: Đơn hàng chờ xử lý */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Đơn hàng chờ gọi</span>
                                    <h3 className="text-2xl font-bold text-indigo-600">{kpis.pendingOrders}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 4: Yêu cầu mua sắm chờ phê duyệt */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Yêu cầu chờ duyệt</span>
                                    <h3 className="text-2xl font-bold text-emerald-600">{kpis.procurementRequests}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 5: Tổng giá trị tồn kho */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Tổng giá trị tồn</span>
                                    <h3 className="text-lg font-bold text-foreground truncate max-w-[130px]">{formatVND(kpis.inventoryValue)}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-600 group-hover:scale-110 transition-transform">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 6: Tổng giá trị nhập */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-600"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Giá trị nhập kỳ</span>
                                    <h3 className="text-lg font-bold text-foreground truncate max-w-[130px]">{formatVND(kpis.importValue)}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 7: Tổng giá trị xuất */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-600"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Giá trị xuất kỳ</span>
                                    <h3 className="text-lg font-bold text-foreground truncate max-w-[130px]">{formatVND(kpis.exportValue)}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-600 group-hover:scale-110 transition-transform">
                                    <ArrowDownRight className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 8: Dưới tồn tối thiểu */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Dưới mốc tối thiểu</span>
                                    <h3 className="text-2xl font-bold text-rose-600">{kpis.belowMinStock}</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI 9: Tỷ lệ thực hiện thầu */}
                        <Card className="bg-neutral border-border hover:shadow-md transition-shadow relative overflow-hidden group col-span-1 sm:col-span-2 md:col-span-1">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Tỷ lệ thực hiện thầu</span>
                                    <h3 className="text-2xl font-bold text-teal-600">{kpis.tenderRate.toFixed(1)}%</h3>
                                </div>
                                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600 group-hover:scale-110 transition-transform">
                                    <Percent className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. Middle Section: Recharts charts */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        
                        {/* Chart 1: Usage and orders trend AreaChart */}
                        <Card className="bg-neutral border-border">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-foreground">Biểu đồ xu hướng gọi hàng theo tháng</CardTitle>
                                <CardDescription>Số lượng vật tư gọi trong năm {selectedYear === 'all' ? new Date().getFullYear() : selectedYear}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={usageTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(218, 100%, 40%)" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="hsl(218, 100%, 40%)" stopOpacity={0.01}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 90%)" />
                                            <XAxis dataKey="month" stroke="hsl(210, 10%, 40%)" fontSize={11} />
                                            <YAxis stroke="hsl(210, 10%, 40%)" fontSize={11} allowDecimals={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 14%, 90%)', borderRadius: '8px' }}
                                                formatter={(value: number) => [value.toLocaleString('vi-VN') + ' đơn vị', 'Số lượng gọi']}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="hsl(218, 100%, 40%)" strokeWidth={2.5} fillOpacity={1} fill="url(#usageGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Chart 2: Top 10 Consumables horizontal BarChart */}
                        <Card className="bg-neutral border-border">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-foreground">Top 10 vật tư tiêu hao nhiều nhất</CardTitle>
                                <CardDescription>Dựa trên lượng xuất kho tiêu hao trong kỳ</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="h-80 w-full">
                                    {topConsumablesData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                            Không có dữ liệu tiêu hao
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topConsumablesData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 90%)" horizontal={false} />
                                                <XAxis type="number" stroke="hsl(210, 10%, 40%)" fontSize={11} />
                                                <YAxis dataKey="name" type="category" stroke="hsl(210, 10%, 40%)" fontSize={10} width={120} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 14%, 90%)', borderRadius: '8px' }}
                                                    formatter={(value: number, name: string, props: any) => [
                                                        `${value.toLocaleString('vi-VN')} ${props.payload.unit}`, 
                                                        'Tiêu hao'
                                                    ]}
                                                    labelFormatter={(label, items) => items[0]?.payload.fullName || label}
                                                />
                                                <Bar dataKey="volume" fill="hsl(215, 90%, 50%)" radius={[0, 4, 4, 0]} maxBarSize={15}>
                                                    {topConsumablesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={`hsl(215, 90%, ${45 + index * 4}%)`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Chart 3: Financial grouped vertical BarChart */}
                        <Card className="bg-neutral border-border xl:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-foreground">Biểu đồ giá trị Nhập – Xuất – Tồn theo nhóm</CardTitle>
                                <CardDescription>So sánh tổng giá trị tài chính (Đồng) của 5 nhóm vật tư có tồn kho lớn nhất</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="h-80 w-full">
                                    {financialComparisonData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                            Không có dữ liệu tài chính
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={financialComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 14%, 90%)" />
                                                <XAxis dataKey="name" stroke="hsl(210, 10%, 40%)" fontSize={11} />
                                                <YAxis stroke="hsl(210, 10%, 40%)" fontSize={11} formatter={(v: number) => `${(v / 1e6).toFixed(0)}M`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 14%, 90%)', borderRadius: '8px' }}
                                                    formatter={(value: number) => [formatVND(value), 'Giá trị']}
                                                    labelFormatter={(label, items) => items[0]?.payload.fullName || label}
                                                />
                                                <Legend />
                                                <Bar dataKey="Nhập trong kỳ" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                                <Bar dataKey="Xuất trong kỳ" fill="hsl(340, 82%, 52%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                                <Bar dataKey="Tồn cuối kỳ" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. Bottom Section: Warnings and alerts tables */}
                    <Card className="bg-neutral border-border shadow-sm">
                        <CardHeader className="pb-3 border-b border-border">
                            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                                Bảng cảnh báo & giám sát rủi ro
                            </CardTitle>
                            <CardDescription>Cảnh báo tồn kho cạn kiệt, khối lượng thầu thầu vượt mốc và lỗi hóa đơn</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Tabs defaultValue="low-stock" className="w-full">
                                <div className="px-4 pt-3 border-b border-border">
                                    <TabsList className="grid grid-cols-3 max-w-xl bg-tertiary">
                                        <TabsTrigger value="low-stock" className="text-xs sm:text-sm">
                                            Vật tư sắp hết ({lowStockAlertItems.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="tenders" className="text-xs sm:text-sm">
                                            Gần hết thầu ({nearExhaustedTenders.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="invoices" className="text-xs sm:text-sm">
                                            Hóa đơn lỗi ({faultyInvoicesList.length})
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Tab 1: Vật tư sắp hết */}
                                <TabsContent value="low-stock" className="m-0 focus-visible:ring-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3">Mã quản lý</th>
                                                    <th className="px-4 py-3">Tên vật tư</th>
                                                    <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                                                    <th className="px-4 py-3 text-right">Mức tối thiểu</th>
                                                    <th className="px-4 py-3 text-right">Tiêu hao kỳ</th>
                                                    <th className="px-4 py-3 text-center">ĐVT</th>
                                                    <th className="px-4 py-3">Mức cảnh báo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {lowStockAlertItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                            Không có vật tư nào rơi vào ngưỡng cảnh báo hết hàng.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    lowStockAlertItems.map((item) => (
                                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.maVtyt}</td>
                                                            <td className="px-4 py-3 font-medium text-foreground">{item.tenVtyt}</td>
                                                            <td className="px-4 py-3 text-right text-rose-600 font-semibold">{item.soLuongTon.toLocaleString('vi-VN')}</td>
                                                            <td className="px-4 py-3 text-right text-muted-foreground">{item.soLuongToiThieu.toLocaleString('vi-VN')}</td>
                                                            <td className="px-4 py-3 text-right">{item.soLuongTieuHao.toLocaleString('vi-VN')}</td>
                                                            <td className="px-4 py-3 text-center text-xs text-muted-foreground">{item.donViTinh}</td>
                                                            <td className="px-4 py-3">
                                                                <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                                                    item.warning.tone === 'destructive'
                                                                        ? 'border-red-200 bg-red-500/10 text-red-600'
                                                                        : 'border-orange-200 bg-orange-500/10 text-orange-600'
                                                                }`}>
                                                                    {item.warning.label}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>

                                {/* Tab 2: Gần hết thầu */}
                                <TabsContent value="tenders" className="m-0 focus-visible:ring-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3">Mã quản lý</th>
                                                    <th className="px-4 py-3">Tên vật tư</th>
                                                    <th className="px-4 py-3">Nhà thầu</th>
                                                    <th className="px-4 py-3 text-right">SL hạn mức</th>
                                                    <th className="px-4 py-3 text-right">Tổng gọi</th>
                                                    <th className="px-4 py-3 text-right">Còn lại thầu</th>
                                                    <th className="px-4 py-3 min-w-[120px]">Tiến độ thực hiện</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {nearExhaustedTenders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                            Không có hợp đồng/gói thầu nào gần cạn hạn mức thực hiện.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    nearExhaustedTenders.map((item) => {
                                                        const remaining = Math.max(0, item.limit - (item.tongNhap || 0));
                                                        return (
                                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.maVtyt}</td>
                                                                <td className="px-4 py-3 font-medium text-foreground">{item.tenVtyt}</td>
                                                                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{item.nhaThau}</td>
                                                                <td className="px-4 py-3 text-right">{item.limit.toLocaleString('vi-VN')}</td>
                                                                <td className="px-4 py-3 text-right text-amber-600 font-medium">{(item.tongNhap || 0).toLocaleString('vi-VN')}</td>
                                                                <td className="px-4 py-3 text-right text-muted-foreground">{remaining.toLocaleString('vi-VN')}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                                            <div 
                                                                                className={`h-full rounded-full ${item.progress > 100 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                                                                style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className={`text-xs font-semibold ${item.progress > 100 ? 'text-red-500' : 'text-amber-600'}`}>
                                                                            {item.progress.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>

                                {/* Tab 3: Hóa đơn lỗi */}
                                <TabsContent value="invoices" className="m-0 focus-visible:ring-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3">Số Hóa Đơn</th>
                                                    <th className="px-4 py-3">Ngày Lập</th>
                                                    <th className="px-4 py-3">Nhà Cung Cấp</th>
                                                    <th className="px-4 py-3">Mặt hàng</th>
                                                    <th className="px-4 py-3 text-right">Số lượng</th>
                                                    <th className="px-4 py-3 text-right">Đơn giá</th>
                                                    <th className="px-4 py-3">Mức lỗi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {faultyInvoicesList.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                            Không có hóa đơn lỗi nào cần phê duyệt hoặc rà soát lại.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    faultyInvoicesList.map((item) => (
                                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-foreground">{item.soHoaDon}</td>
                                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                                {new Date(item.ngayHoaDon).toLocaleDateString('vi-VN')}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-medium text-foreground">{item.congTy}</td>
                                                            <td className="px-4 py-3 text-xs max-w-[200px] truncate">{item.tenHangHoa}</td>
                                                            <td className="px-4 py-3 text-right">{item.soLuong.toLocaleString('vi-VN')}</td>
                                                            <td className="px-4 py-3 text-right">{formatVND(item.donGiaChuaThue)}</td>
                                                            <td className="px-4 py-3">
                                                                <Badge className="bg-red-500/10 text-red-600 border border-red-200 hover:bg-red-500/20 text-[10px] uppercase font-semibold">
                                                                    {item.trangThaiHoaDon}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
