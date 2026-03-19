import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderRequest } from '@/types';
import { apiService, ApiSupply, CompanyContactSuggestion, getNullableString } from '@/services/api';

interface CreateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (order: OrderRequest) => void | Promise<void>;
}

type SupplyLookupField = 'maQuanLy' | 'maVtytCu' | 'tenVtytBv';

const normalizeText = (value: string) => value.trim().toLowerCase();

export default function CreateOrderDialog({ open, onOpenChange, onSubmit }: CreateOrderDialogProps) {
    const [formData, setFormData] = useState<Partial<OrderRequest>>({
        nhaThau: '',
        maQuanLy: '',
        maVtytCu: '',
        tenVtytBv: '',
        maHieu: '',
        hangSx: '',
        donViTinh: '',
        quyCach: '',
        dotGoiHang: 1,
        email: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companySuggestions, setCompanySuggestions] = useState<CompanyContactSuggestion[]>([]);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [isLoadingCompanySuggestions, setIsLoadingCompanySuggestions] = useState(false);
    const [supplySuggestions, setSupplySuggestions] = useState<ApiSupply[]>([]);
    const [showSupplySuggestionsFor, setShowSupplySuggestionsFor] = useState<SupplyLookupField | null>(null);
    const [isLoadingSupplySuggestions, setIsLoadingSupplySuggestions] = useState(false);

    const matchingCompany = useMemo(() => {
        const currentCompany = normalizeText(formData.nhaThau || '');
        if (!currentCompany) return null;
        return companySuggestions.find((item) => normalizeText(item.companyName) === currentCompany) || null;
    }, [companySuggestions, formData.nhaThau]);

    const handleInputChange = (field: keyof OrderRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
        // Xóa lỗi khi người dùng bắt đầu nhập lại
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSelectCompany = (contact: CompanyContactSuggestion) => {
        setFormData((prev) => ({
            ...prev,
            nhaThau: contact.companyName,
            email: contact.email || prev.email || '',
        }));
        setShowCompanySuggestions(false);
    };

    const handleSupplyLookupInput = (field: SupplyLookupField, value: string) => {
        handleInputChange(field, value);
        setShowSupplySuggestionsFor(field);
    };

    const handleSelectSupply = (supply: ApiSupply) => {
        const maQuanLy = getNullableString(supply.idx2) || String(supply.idx1 || '');
        const maVtytCu = getNullableString(supply.id);
        const tenVtytBv = getNullableString(supply.name);

        setFormData((prev) => ({
            ...prev,
            maQuanLy,
            maVtytCu,
            tenVtytBv,
            maHieu: getNullableString(supply.maHieu),
            hangSx: getNullableString(supply.hangSx),
            donViTinh: getNullableString(supply.unit),
            quyCach: getNullableString(supply.quyCach),
        }));

        setShowSupplySuggestionsFor(null);
        setSupplySuggestions([]);
    };

    useEffect(() => {
        if (!open) {
            setCompanySuggestions([]);
            setSupplySuggestions([]);
            setShowCompanySuggestions(false);
            setShowSupplySuggestionsFor(null);
            return;
        }

        const keyword = (formData.nhaThau || '').trim();
        if (keyword.length < 2) {
            setCompanySuggestions([]);
            setShowCompanySuggestions(false);
            return;
        }

        let isCancelled = false;
        const timer = window.setTimeout(async () => {
            setIsLoadingCompanySuggestions(true);
            try {
                const response = await apiService.searchCompanyContacts(keyword, 8);
                if (!isCancelled) {
                    setCompanySuggestions(response.data || []);
                    setShowCompanySuggestions(true);
                }
            } catch {
                if (!isCancelled) {
                    setCompanySuggestions([]);
                    setShowCompanySuggestions(false);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingCompanySuggestions(false);
                }
            }
        }, 250);

        return () => {
            isCancelled = true;
            window.clearTimeout(timer);
        };
    }, [formData.nhaThau, open]);

    useEffect(() => {
        if (!open || !showSupplySuggestionsFor) {
            return;
        }

        const keyword = (formData[showSupplySuggestionsFor] || '').toString().trim();
        if (keyword.length < 2) {
            setSupplySuggestions([]);
            return;
        }

        let isCancelled = false;
        const timer = window.setTimeout(async () => {
            setIsLoadingSupplySuggestions(true);
            try {
                const response = await apiService.searchSupplies(keyword, 1, 8);
                if (!isCancelled) {
                    setSupplySuggestions(response.data || []);
                }
            } catch {
                if (!isCancelled) {
                    setSupplySuggestions([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingSupplySuggestions(false);
                }
            }
        }, 250);

        return () => {
            isCancelled = true;
            window.clearTimeout(timer);
        };
    }, [formData, open, showSupplySuggestionsFor]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nhaThau?.trim()) newErrors.nhaThau = 'Nhà thầu không được để trống';
        if (!formData.maVtytCu?.trim()) newErrors.maVtytCu = 'Mã vật tư không được để trống';
        if (!formData.tenVtytBv?.trim()) newErrors.tenVtytBv = 'Tên vật tư không được để trống';
        if (!formData.donViTinh?.trim()) newErrors.donViTinh = 'Đơn vị tính không được để trống';
        if (!formData.quyCach?.trim()) newErrors.quyCach = 'Quy cách không được để trống';
        if (!formData.dotGoiHang || formData.dotGoiHang < 1) newErrors.dotGoiHang = 'Số lượng phải >= 1';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const newOrder: OrderRequest = {
            id: Date.now(),
            nhaThau: formData.nhaThau || '',
            maQuanLy: formData.maQuanLy || '',
            maVtytCu: formData.maVtytCu || '',
            tenVtytBv: formData.tenVtytBv || '',
            maHieu: formData.maHieu || '',
            hangSx: formData.hangSx || '',
            donViTinh: formData.donViTinh || '',
            quyCach: formData.quyCach || '',
            dotGoiHang: formData.dotGoiHang || 1,
            email: formData.email,
            source: 'manual',
        };

        setIsSubmitting(true);
        try {
            await onSubmit(newOrder);

            // Reset form
            setFormData({
                nhaThau: '',
                maQuanLy: '',
                maVtytCu: '',
                tenVtytBv: '',
                maHieu: '',
                hangSx: '',
                donViTinh: '',
                quyCach: '',
                dotGoiHang: 1,
                email: '',
            });
            setErrors({});
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tạo đơn hàng mới</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin chi tiết cho đơn hàng mới
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Thông tin nhà thầu */}
                    <Card className="bg-neutral border-border">
                        <CardHeader>
                            <CardTitle className="text-base">Thông tin nhà thầu</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="nhaThau" className="text-foreground font-medium">
                                        Nhà thầu <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="nhaThau"
                                        placeholder="Tên công ty nhà thầu"
                                        value={formData.nhaThau || ''}
                                        onChange={(e) => handleInputChange('nhaThau', e.target.value)}
                                        onFocus={() => {
                                            if (companySuggestions.length > 0) {
                                                setShowCompanySuggestions(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            window.setTimeout(() => setShowCompanySuggestions(false), 120);
                                        }}
                                        className={errors.nhaThau ? 'border-red-500' : ''}
                                    />
                                    {showCompanySuggestions && (
                                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg">
                                            {isLoadingCompanySuggestions ? (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm công ty...</div>
                                            ) : companySuggestions.length > 0 ? (
                                                companySuggestions.map((contact) => (
                                                    <button
                                                        key={contact.id}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => handleSelectCompany(contact)}
                                                        className="w-full px-3 py-2 text-left hover:bg-muted/50"
                                                    >
                                                        <div className="text-sm font-medium text-foreground">{contact.companyName}</div>
                                                        <div className="text-xs text-muted-foreground">{contact.email || 'Chưa có email'}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Không có gợi ý</div>
                                            )}
                                        </div>
                                    )}
                                    {errors.nhaThau && <p className="text-sm text-red-500">{errors.nhaThau}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground font-medium">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={matchingCompany?.email || 'email@example.com'}
                                        value={formData.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin vật tư */}
                    <Card className="bg-neutral border-border">
                        <CardHeader>
                            <CardTitle className="text-base">Thông tin vật tư</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="maQuanLy" className="text-foreground font-medium">
                                        Mã quản lý
                                    </Label>
                                    <Input
                                        id="maQuanLy"
                                        placeholder="VD: MA001"
                                        value={formData.maQuanLy || ''}
                                        onChange={(e) => handleSupplyLookupInput('maQuanLy', e.target.value)}
                                        onFocus={() => setShowSupplySuggestionsFor('maQuanLy')}
                                        onBlur={() => {
                                            window.setTimeout(() => setShowSupplySuggestionsFor(null), 120);
                                        }}
                                    />
                                    {showSupplySuggestionsFor === 'maQuanLy' && (
                                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg">
                                            {isLoadingSupplySuggestions ? (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm vật tư...</div>
                                            ) : supplySuggestions.length > 0 ? (
                                                supplySuggestions.map((supply) => (
                                                    <button
                                                        key={`${supply.idx1}-${getNullableString(supply.id)}-${getNullableString(supply.idx2)}`}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => handleSelectSupply(supply)}
                                                        className="w-full px-3 py-2 text-left hover:bg-muted/50"
                                                    >
                                                        <div className="text-sm font-medium text-foreground">{getNullableString(supply.idx2) || supply.idx1}</div>
                                                        <div className="text-xs text-muted-foreground">{getNullableString(supply.name)} • {getNullableString(supply.id)}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Không có gợi ý</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="maVtytCu" className="text-foreground font-medium">
                                        Mã vật tư <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="maVtytCu"
                                        placeholder="VD: VT001"
                                        value={formData.maVtytCu || ''}
                                        onChange={(e) => handleSupplyLookupInput('maVtytCu', e.target.value)}
                                        onFocus={() => setShowSupplySuggestionsFor('maVtytCu')}
                                        onBlur={() => {
                                            window.setTimeout(() => setShowSupplySuggestionsFor(null), 120);
                                        }}
                                        className={errors.maVtytCu ? 'border-red-500' : ''}
                                    />
                                    {showSupplySuggestionsFor === 'maVtytCu' && (
                                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg">
                                            {isLoadingSupplySuggestions ? (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm vật tư...</div>
                                            ) : supplySuggestions.length > 0 ? (
                                                supplySuggestions.map((supply) => (
                                                    <button
                                                        key={`${supply.idx1}-${getNullableString(supply.id)}-${getNullableString(supply.idx2)}`}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => handleSelectSupply(supply)}
                                                        className="w-full px-3 py-2 text-left hover:bg-muted/50"
                                                    >
                                                        <div className="text-sm font-medium text-foreground">{getNullableString(supply.id)}</div>
                                                        <div className="text-xs text-muted-foreground">{getNullableString(supply.name)} • MQL: {getNullableString(supply.idx2) || supply.idx1}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Không có gợi ý</div>
                                            )}
                                        </div>
                                    )}
                                    {errors.maVtytCu && <p className="text-sm text-red-500">{errors.maVtytCu}</p>}
                                </div>

                                <div className="space-y-2 col-span-2 relative">
                                    <Label htmlFor="tenVtytBv" className="text-foreground font-medium">
                                        Tên vật tư <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="tenVtytBv"
                                        placeholder="Tên chi tiết của vật tư"
                                        value={formData.tenVtytBv || ''}
                                        onChange={(e) => handleSupplyLookupInput('tenVtytBv', e.target.value)}
                                        onFocus={() => setShowSupplySuggestionsFor('tenVtytBv')}
                                        onBlur={() => {
                                            window.setTimeout(() => setShowSupplySuggestionsFor(null), 120);
                                        }}
                                        className={errors.tenVtytBv ? 'border-red-500' : ''}
                                    />
                                    {showSupplySuggestionsFor === 'tenVtytBv' && (
                                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg">
                                            {isLoadingSupplySuggestions ? (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm vật tư...</div>
                                            ) : supplySuggestions.length > 0 ? (
                                                supplySuggestions.map((supply) => (
                                                    <button
                                                        key={`${supply.idx1}-${getNullableString(supply.id)}-${getNullableString(supply.idx2)}`}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => handleSelectSupply(supply)}
                                                        className="w-full px-3 py-2 text-left hover:bg-muted/50"
                                                    >
                                                        <div className="text-sm font-medium text-foreground">{getNullableString(supply.name)}</div>
                                                        <div className="text-xs text-muted-foreground">{getNullableString(supply.id)} • {getNullableString(supply.unit)}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Không có gợi ý</div>
                                            )}
                                        </div>
                                    )}
                                    {errors.tenVtytBv && <p className="text-sm text-red-500">{errors.tenVtytBv}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maHieu" className="text-foreground font-medium">
                                        Mã hiệu
                                    </Label>
                                    <Input
                                        id="maHieu"
                                        placeholder="VD: MH001"
                                        value={formData.maHieu || ''}
                                        onChange={(e) => handleInputChange('maHieu', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hangSx" className="text-foreground font-medium">
                                        Hãng sản xuất
                                    </Label>
                                    <Input
                                        id="hangSx"
                                        placeholder="Tên hãng"
                                        value={formData.hangSx || ''}
                                        onChange={(e) => handleInputChange('hangSx', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="donViTinh" className="text-foreground font-medium">
                                        Đơn vị tính <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="donViTinh"
                                        placeholder="VD: chiếc, hộp, lọ"
                                        value={formData.donViTinh || ''}
                                        onChange={(e) => handleInputChange('donViTinh', e.target.value)}
                                        className={errors.donViTinh ? 'border-red-500' : ''}
                                    />
                                    {errors.donViTinh && <p className="text-sm text-red-500">{errors.donViTinh}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="quyCach" className="text-foreground font-medium">
                                        Quy cách <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="quyCach"
                                        placeholder="VD: 50ml, 500g"
                                        value={formData.quyCach || ''}
                                        onChange={(e) => handleInputChange('quyCach', e.target.value)}
                                        className={errors.quyCach ? 'border-red-500' : ''}
                                    />
                                    {errors.quyCach && <p className="text-sm text-red-500">{errors.quyCach}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dotGoiHang" className="text-foreground font-medium">
                                        Số lượng <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="dotGoiHang"
                                        type="number"
                                        min="1"
                                        placeholder="VD: 10"
                                        value={formData.dotGoiHang || 1}
                                        onChange={(e) => handleInputChange('dotGoiHang', parseInt(e.target.value) || 1)}
                                        className={errors.dotGoiHang ? 'border-red-500' : ''}
                                    />
                                    {errors.dotGoiHang && <p className="text-sm text-red-500">{errors.dotGoiHang}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ghi chú */}
                    <Card className="bg-neutral border-border">
                        <CardHeader>
                            <CardTitle className="text-base">Ghi chú</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-foreground font-medium">
                                    Ghi chú thêm
                                </Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Nhập các ghi chú hoặc yêu cầu đặc biệt"
                                    rows={3}
                                    disabled
                                    className="text-muted-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Chức năng này sẽ được cập nhật trong phiên bản sau</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isSubmitting ? 'Đang tạo...' : 'Tạo đơn hàng'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
