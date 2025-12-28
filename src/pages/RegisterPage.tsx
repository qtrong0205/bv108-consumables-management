import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const [staffName, setStaffName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!staffName.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập họ và tên",
                variant: "destructive",
            });
            return;
        }

        if (!validateEmail(email)) {
            toast({
                title: "Lỗi",
                description: "Email không hợp lệ",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Lỗi",
                description: "Mật khẩu phải có ít nhất 6 ký tự",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Lỗi",
                description: "Mật khẩu xác nhận không khớp",
                variant: "destructive",
            });
            return;
        }

        if (!role) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn vai trò",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Đăng ký thành công",
                description: "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
            });
            navigate('/login');
        }, 1500);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-tertiary relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src="https://c.animaapp.com/mjcycuttvHS1Z6/img/ai_1.png"
                    alt="medical abstract background"
                    className="w-full h-full object-cover opacity-20"
                    loading="lazy"
                />
            </div>

            <Card className="w-full max-w-md mx-4 z-10 bg-neutral shadow-lg border-border">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img src="./logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
                        <CardTitle className="text-2xl font-semibold text-foreground">Đăng Ký</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                        Tạo tài khoản mới cho Hệ Thống Quản Lý Vật Tư
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="staffName" className="text-foreground">Họ và tên</Label>
                            <Input
                                id="staffName"
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={staffName}
                                onChange={(e) => setStaffName(e.target.value)}
                                required
                                className="bg-neutral text-foreground border-border"
                                tabIndex={1}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Nhập địa chỉ email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-neutral text-foreground border-border"
                                tabIndex={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-neutral text-foreground border-border pr-10"
                                    tabIndex={3}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-neutral text-foreground border-border pr-10"
                                    tabIndex={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-foreground">Vai trò</Label>
                            <Select value={role} onValueChange={setRole} required>
                                <SelectTrigger id="role" className="bg-neutral text-foreground border-border" tabIndex={5}>
                                    <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Department Commander">Chỉ huy khoa</SelectItem>
                                    <SelectItem value="Contractor">Nhân viên thầu</SelectItem>
                                    <SelectItem value="Warehouse Staff">Nhân viên kho</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                            tabIndex={6}
                        >
                            {isLoading ? "Đang xử lý..." : "Đăng ký"}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Đã có tài khoản?{' '}
                            <Link
                                to="/login"
                                className="text-secondary hover:text-secondary/80 transition-colors font-medium"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
