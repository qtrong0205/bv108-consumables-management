import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { ProcurementPlan } from '@/pages/ProcurementPlanning';
import { useToast } from '@/hooks/use-toast';

interface CreateOrderDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    plan: ProcurementPlan | null;
}

export default function CreateOrderDrawer({ isOpen, onClose, plan }: CreateOrderDrawerProps) {
    const [orderName, setOrderName] = useState('');
    const [supplier, setSupplier] = useState('');
    const [priority, setPriority] = useState('');
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: 'Đã tạo đơn hàng',
            description: `Đơn hàng "${orderName}" đã được tạo thành công.`,
        });
        onClose();
        setOrderName('');
        setSupplier('');
        setPriority('');
        setNotes('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral text-foreground border-border max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">Tạo đơn hàng mới</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {plan ? `Dựa trên kế hoạch: ${plan.planName}` : 'Tạo đơn hàng mua sắm mới'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="orderName" className="text-foreground">Tên đơn hàng</Label>
                        <Input
                            id="orderName"
                            value={orderName}
                            onChange={(e) => setOrderName(e.target.value)}
                            placeholder="Nhập tên đơn hàng"
                            required
                            className="bg-neutral text-foreground border-border"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-foreground">Nhà cung cấp</Label>
                        <Select value={supplier} onValueChange={setSupplier} required>
                            <SelectTrigger id="supplier" className="bg-neutral text-foreground border-border">
                                <SelectValue placeholder="Chọn nhà cung cấp" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="medsupply">Công ty Vật tư Y tế</SelectItem>
                                <SelectItem value="healthtech">Công ty Y tế Sức khỏe</SelectItem>
                                <SelectItem value="veincare">Công ty Chăm sóc Tĩnh mạch</SelectItem>
                                <SelectItem value="cleanmed">Công ty Vệ sinh Y tế</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-foreground">Độ ưu tiên</Label>
                        <Select value={priority} onValueChange={setPriority} required>
                            <SelectTrigger id="priority" className="bg-neutral text-foreground border-border">
                                <SelectValue placeholder="Chọn độ ưu tiên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Thấp</SelectItem>
                                <SelectItem value="medium">Trung bình</SelectItem>
                                <SelectItem value="high">Cao</SelectItem>
                                <SelectItem value="urgent">Khẩn cấp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-foreground">Ghi chú</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Thêm ghi chú hoặc yêu cầu bổ sung"
                            rows={4}
                            className="bg-neutral text-foreground border-border"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                        >
                            Tạo đơn hàng
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
