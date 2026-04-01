import { useEffect, useState } from 'react';
import { ApiInvoiceReconciliationRecord, apiService } from '@/services/api';
import InvoiceMatchHistoryTable from '@/components/orders/InvoiceMatchHistoryTable';

const normalizeInvoiceKey = (value: string) => value.trim().toLowerCase();

const invoiceUiCache = {
    activeTab: 'reconcile',
    tabStates: {
        reconcile: {
            searchTerm: '',
            expandedSuppliers: new Set<string>(),
            filterSupplierStatus: 'all' as 'all' | 'hasInvoice' | 'noInvoice',
        },
        ubot: {
            searchTerm: '',
            expandedInvoices: new Set<string>(),
            currentPage: 1,
        },
        history: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            searchTerm: '',
        },
    },
};
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceTable from '@/components/orders/InvoiceTable';
import UBotInvoiceTable from '@/components/orders/UBotInvoiceTable';
import { useOrder } from '@/context/OrderContext';
import { useHoaDonUBot } from '@/hooks/use-hoadon-ubot';

export default function InvoiceManagement() {
    const [activeTab, setActiveTab] = useState(invoiceUiCache.activeTab);
    
    // Tab-specific state storage
    const [tabStates, setTabStates] = useState<{
        reconcile: {
            searchTerm: string;
            expandedSuppliers: Set<string>;
            filterSupplierStatus: 'all' | 'hasInvoice' | 'noInvoice';
        };
        ubot: {
            searchTerm: string;
            expandedInvoices: Set<string>;
            currentPage: number;
        };
        history: {
            month: number;
            year: number;
            searchTerm: string;
        };
    }>(invoiceUiCache.tabStates);

    const updateTabState = (tab: 'reconcile' | 'ubot' | 'history', state: Record<string, unknown>) => {
        setTabStates(prev => ({
            ...prev,
            [tab]: { ...prev[tab], ...state },
        }));
    };

    useEffect(() => {
        invoiceUiCache.activeTab = activeTab;
        invoiceUiCache.tabStates = tabStates;
    }, [activeTab, tabStates]);

    const { orderHistory, refreshOrders, loadingOrders, realtimeEventVersion, lastRealtimeEvent } = useOrder();
    const { hoaDons, loading, error, refetch } = useHoaDonUBot();
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyRecords, setHistoryRecords] = useState<ApiInvoiceReconciliationRecord[]>([]);
    const [matchedInvoiceNumbers, setMatchedInvoiceNumbers] = useState<Set<string>>(new Set());
    const [matchedOrderRecords, setMatchedOrderRecords] = useState<ApiInvoiceReconciliationRecord[]>([]);
    const [matchedOrdersLoaded, setMatchedOrdersLoaded] = useState(false);

    const loadInvoiceHistory = async () => {
        try {
            setHistoryLoading(true);
            setHistoryError(null);
            const response = await apiService.getInvoiceReconciliationHistory(
                tabStates.history.month,
                tabStates.history.year,
            );
            setHistoryRecords(response.data || []);
        } catch (fetchError) {
            setHistoryError(fetchError instanceof Error ? fetchError.message : 'Không tải được lịch sử đối chiếu');
            setHistoryRecords([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadMatchedInvoices = async () => {
        try {
            const response = await apiService.getMatchedInvoiceNumbers({ all: true });
            const normalized = new Set((response.data || []).map((value) => normalizeInvoiceKey(value)));
            setMatchedInvoiceNumbers(normalized);
        } catch (fetchError) {
            console.error('Không tải được danh sách hóa đơn đã khớp:', fetchError);
        }
    };

    const loadMatchedOrders = async () => {
        try {
            setMatchedOrdersLoaded(false);
            const response = await apiService.getMatchedOrderReconciliations();
            setMatchedOrderRecords(response.data || []);
        } catch (fetchError) {
            console.error('Không tải được lịch sử đơn hàng đã khớp:', fetchError);
        } finally {
            setMatchedOrdersLoaded(true);
        }
    };

    const handleMatchedInvoicesSaved = (invoiceNumbers: string[]) => {
        if (invoiceNumbers.length === 0) return;
        setMatchedInvoiceNumbers((prev) => {
            const next = new Set(prev);
            invoiceNumbers.forEach((value) => {
                const key = normalizeInvoiceKey(value);
                if (key) next.add(key);
            });
            return next;
        });
    };

    useEffect(() => {
        void refreshOrders().catch(() => undefined);
    }, []);

    useEffect(() => {
        void loadMatchedInvoices();
        void loadMatchedOrders();
    }, []);

    useEffect(() => {
        if (activeTab !== 'history') return;
        void loadInvoiceHistory();
        void loadMatchedInvoices();
        void loadMatchedOrders();
    }, [activeTab, tabStates.history.month, tabStates.history.year]);

    useEffect(() => {
        if (!lastRealtimeEvent) return;

        if (lastRealtimeEvent.type === 'invoices.reconciliation_updated') {
            void loadMatchedInvoices();
            void loadMatchedOrders();
            void loadInvoiceHistory();
            return;
        }

        if (lastRealtimeEvent.type === 'invoices.data_refreshed') {
            refetch();
            void loadMatchedInvoices();
            void loadMatchedOrders();
            void loadInvoiceHistory();
            return;
        }

        if (lastRealtimeEvent.type === 'orders.updated' || lastRealtimeEvent.type === 'orders.new_pending') {
            void loadMatchedOrders();
            void loadInvoiceHistory();
        }
    }, [realtimeEventVersion]);

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-tertiary/95 backdrop-blur supports-[backdrop-filter]:bg-tertiary/80 border-b border-border space-y-3">
                    <div>
                        <h1 className="text-2xl font-semibold mb-2">Hóa đơn</h1>
                        <p className="text-muted-foreground">
                            Quản lý và đối chiếu hóa đơn từ UBot
                        </p>
                    </div>
                    <TabsList className="grid w-full max-w-2xl grid-cols-3">
                        <TabsTrigger value="reconcile">Đối chiếu đơn hàng</TabsTrigger>
                        <TabsTrigger value="ubot">Hóa đơn UBot</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử đã khớp</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="reconcile" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            {loadingOrders || !matchedOrdersLoaded ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Đang tải lịch sử đơn hàng...
                                </div>
                            ) : (
                                <InvoiceTable 
                                    orders={orderHistory} 
                                    hoaDons={hoaDons} 
                                    matchedInvoiceNumbers={matchedInvoiceNumbers}
                                    matchedReconciliations={matchedOrderRecords}
                                    onMatchedInvoicesSaved={handleMatchedInvoicesSaved}
                                    searchTerm={tabStates.reconcile.searchTerm}
                                    onSearchChange={(term) => updateTabState('reconcile', { searchTerm: term })}
                                    expandedSuppliers={tabStates.reconcile.expandedSuppliers}
                                    onExpandedSuppliersChange={(expanded) => updateTabState('reconcile', { expandedSuppliers: expanded })}
                                    filterSupplierStatus={tabStates.reconcile.filterSupplierStatus}
                                    onFilterSupplierStatusChange={(status) => updateTabState('reconcile', { filterSupplierStatus: status })}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ubot" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            {error ? (
                                <div className="text-center py-8">
                                    <div className="text-destructive mb-2">Lỗi tải dữ liệu</div>
                                    <div className="text-sm text-muted-foreground">{error}</div>
                                </div>
                            ) : (
                                <UBotInvoiceTable 
                                    hoaDons={hoaDons}
                                    loading={loading}
                                    onRefresh={refetch}
                                    matchedInvoiceNumbers={matchedInvoiceNumbers}
                                    searchTerm={tabStates.ubot.searchTerm}
                                    onSearchChange={(term) => updateTabState('ubot', { searchTerm: term })}
                                    expandedInvoices={tabStates.ubot.expandedInvoices}
                                    onExpandedInvoicesChange={(expanded) => updateTabState('ubot', { expandedInvoices: expanded })}
                                    currentPage={tabStates.ubot.currentPage}
                                    onCurrentPageChange={(page) => updateTabState('ubot', { currentPage: page })}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <InvoiceMatchHistoryTable
                                records={historyRecords}
                                loading={historyLoading}
                                error={historyError}
                                month={tabStates.history.month}
                                year={tabStates.history.year}
                                searchTerm={tabStates.history.searchTerm}
                                onMonthChange={(month) => updateTabState('history', { month })}
                                onYearChange={(year) => updateTabState('history', { year })}
                                onSearchChange={(term) => updateTabState('history', { searchTerm: term })}
                                onRefresh={() => {
                                    void loadInvoiceHistory();
                                    void loadMatchedInvoices();
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

