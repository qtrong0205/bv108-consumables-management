import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Truck } from 'lucide-react';
import { ProcurementPlan } from '@/pages/ProcurementPlanning';

interface PlanListProps {
    plans: ProcurementPlan[];
    onCreateOrder: (plan: ProcurementPlan) => void;
    userRole: string;
}

const statusColors = {
    draft: 'bg-gray-500 text-white',
    pending: 'bg-secondary text-secondary-foreground',
    approved: 'bg-success text-success-foreground',
};

const statusLabels = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
};

export default function PlanList({ plans, onCreateOrder, userRole }: PlanListProps) {
    const canCreateOrder = userRole === 'Admin' || userRole === 'Officer';

    if (plans.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Không có kế hoạch nào trong danh mục này</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {plans.map((plan) => (
                <div
                    key={plan.id}
                    className="p-6 border border-border rounded-lg bg-neutral hover:bg-tertiary transition-colors"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-foreground">{plan.planName}</h3>
                                <Badge className={statusColors[plan.status]}>
                                    {statusLabels[plan.status]}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>Người tạo: <span className="text-foreground">{plan.createdBy}</span></span>
                                <span>Cập nhật: <span className="text-foreground">{plan.lastUpdated}</span></span>
                                <span>Số lượng: <span className="text-foreground">{plan.items}</span></span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {canCreateOrder && (
                                <Button
                                    onClick={() => onCreateOrder(plan)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" strokeWidth={2} />
                                    Tạo đơn hàng
                                </Button>
                            )}
                            {plan.status === 'approved' && (
                                <Button
                                    variant="outline"
                                    className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                                >
                                    <Truck className="w-4 h-4 mr-2" strokeWidth={2} />
                                    Theo dõi giao hàng
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
