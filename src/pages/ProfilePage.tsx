import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getStoredAuth, apiService, updateStoredAuthUser } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const formatRoleLabel = (role: string): string => {
    if (role === 'truong_khoa') return 'Trưởng khoa';
    if (role === 'nhan_vien') return 'Nhân viên';
    return role;
};

const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function ProfilePage() {
    const storedAuth = useMemo(() => getStoredAuth(), []);
    const { toast } = useToast();

    const [fullName, setFullName] = useState(storedAuth?.user.username || '');
    const [email, setEmail] = useState(storedAuth?.user.email || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    useEffect(() => {
        if (!storedAuth) {
            return;
        }

        let isMounted = true;

        const loadProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const response = await apiService.getProfile();
                if (!isMounted) {
                    return;
                }

                setFullName(response.user.username);
                setEmail(response.user.email);
                updateStoredAuthUser(response.user);
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                toast({
                    title: 'Không tải được hồ sơ',
                    description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
                    variant: 'destructive',
                });
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [storedAuth, toast]);

    if (!storedAuth) {
        return <Navigate to="/login" replace />;
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const nextName = fullName.trim();
        const nextEmail = email.trim().toLowerCase();

        if (!nextName) {
            toast({
                title: 'Lỗi',
                description: 'Họ và tên không được để trống',
                variant: 'destructive',
            });
            return;
        }

        if (!validateEmail(nextEmail)) {
            toast({
                title: 'Lỗi',
                description: 'Email không hợp lệ',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);

        try {
            const response = await apiService.updateProfile({
                username: nextName,
                email: nextEmail,
            });

            updateStoredAuthUser(response.user);
            setFullName(response.user.username);
            setEmail(response.user.email);

            toast({
                title: 'Đã cập nhật hồ sơ',
                description: 'Thông tin người dùng đã được lưu vào hệ thống.',
            });
        } catch (error) {
            toast({
                title: 'Cập nhật thất bại',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-2xl bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Hồ sơ tài khoản</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Xem và cập nhật thông tin người dùng của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-foreground">Họ và tên</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nhập họ và tên"
                                className="bg-neutral text-foreground border-border"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email"
                                className="bg-neutral text-foreground border-border"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-foreground">Vai trò</Label>
                            <Input
                                id="role"
                                value={formatRoleLabel(storedAuth.user.role)}
                                disabled
                                className="bg-muted text-muted-foreground border-border"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {isSaving ? 'Đang lưu...' : isLoadingProfile ? 'Đang tải hồ sơ...' : 'Lưu thay đổi'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link to="/dashboard">Quay lại</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
