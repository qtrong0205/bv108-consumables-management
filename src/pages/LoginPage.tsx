import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthResponse, apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface LoginPageProps {
    onLogin: (auth: AuthResponse) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            const auth = await apiService.login({
                email: email.trim(),
                password,
            });
            onLogin(auth);
        } catch (error) {
            toast({
                title: 'Đăng nhập thất bại',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
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
                        <CardTitle className="text-2xl font-semibold text-foreground">Vật Tư Y Tế</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                        Hệ Thống Quản Lý Vật Tư Bệnh Viện TWQĐ 108
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Nhập email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-neutral text-foreground border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Mật khẩu</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-neutral text-foreground border-border"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <Label
                                htmlFor="remember"
                                className="text-sm font-normal cursor-pointer text-foreground"
                            >
                                Ghi nhớ đăng nhập
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>

                        <div className="text-center space-y-2">
                            <a
                                href="#"
                                className="text-sm text-secondary hover:text-secondary/80 transition-colors block"
                            >
                                Quên mật khẩu?
                            </a>
                            <p className="text-sm text-muted-foreground">
                                Chưa có tài khoản?{' '}
                                <Link
                                    to="/register"
                                    className="text-secondary hover:text-secondary/80 transition-colors font-medium"
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
