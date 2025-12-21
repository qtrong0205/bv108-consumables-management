import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PlanList from '@/components/procurement/PlanList';
import CreateOrderDrawer from '@/components/procurement/CreateOrderDrawer';

export interface ProcurementPlan {
    id: string;
    planName: string;
    createdBy: string;
    lastUpdated: string;
    status: 'draft' | 'pending' | 'approved';
    items: number;
}

const mockPlans: ProcurementPlan[] = [
    {
        id: '1',
        planName: 'Vật tư y tế Quý 1 2024',
        createdBy: 'BS. Nguyễn Văn A',
        lastUpdated: '2024-01-15',
        status: 'approved',
        items: 12,
    },
    {
        id: '2',
        planName: 'Bổ sung đồ bảo hộ khẩn cấp',
        createdBy: 'Điều dưỡng Trần Thị B',
        lastUpdated: '2024-01-18',
        status: 'pending',
        items: 8,
    },
    {
        id: '3',
        planName: 'Đặt hàng thiết bị phẫu thuật',
        createdBy: 'BS. Lê Văn C',
        lastUpdated: '2024-01-20',
        status: 'draft',
        items: 15,
    },
    {
        id: '4',
        planName: 'Vật tư tiêu hao hàng tháng',
        createdBy: 'Nhân viên quản trị',
        lastUpdated: '2024-01-22',
        status: 'approved',
        items: 25,
    },
    {
        id: '5',
        planName: 'Bổ sung vật tư truyền dịch',
        createdBy: 'Điều dưỡng Phạm Thị D',
        lastUpdated: '2024-01-23',
        status: 'pending',
        items: 6,
    },
];

interface ProcurementPlanningProps {
    userRole: string;
}

export default function ProcurementPlanning({ userRole }: ProcurementPlanningProps) {
    const [activeTab, setActiveTab] = useState('pending');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<ProcurementPlan | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const draftPlans = mockPlans.filter((plan) => plan.status === 'draft');
    const pendingPlans = mockPlans.filter((plan) => plan.status === 'pending');
    const approvedPlans = mockPlans.filter((plan) => plan.status === 'approved');

    const handleCreateOrder = (plan: ProcurementPlan) => {
        setSelectedPlan(plan);
        setIsDrawerOpen(true);
    };

    const canCreateOrder = userRole === 'Admin' || userRole === 'Officer';

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Kế hoạch mua sắm</h1>
                    <p className="text-muted-foreground">Quản lý kế hoạch mua sắm và tạo đơn hàng</p>
                </div>
                {canCreateOrder && (
                    <Button
                        onClick={() => setIsDrawerOpen(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                    >
                        <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
                        Kế hoạch mới
                    </Button>
                )}
            </div>

            <Card className="bg-neutral border-border">
                <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="draft" className="text-foreground">
                                Nháp ({draftPlans.length})
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="text-foreground">
                                Chờ duyệt ({pendingPlans.length})
                            </TabsTrigger>
                            <TabsTrigger value="approved" className="text-foreground">
                                Đã duyệt ({approvedPlans.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="draft">
                            <PlanList
                                plans={draftPlans}
                                onCreateOrder={handleCreateOrder}
                                userRole={userRole}
                            />
                        </TabsContent>

                        <TabsContent value="pending">
                            <PlanList
                                plans={pendingPlans}
                                onCreateOrder={handleCreateOrder}
                                userRole={userRole}
                            />
                        </TabsContent>

                        <TabsContent value="approved">
                            <PlanList
                                plans={approvedPlans}
                                onCreateOrder={handleCreateOrder}
                                userRole={userRole}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <CreateOrderDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedPlan(null);
                }}
                plan={selectedPlan}
            />
        </div>
    );
}
