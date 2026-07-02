import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MetricCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
    linkTo?: string;
}

export default function MetricCard({ title, value, icon: Icon, color, linkTo = "/catalog" }: MetricCardProps) {
    return (
        <Link to={linkTo}>
            <Card className="bg-neutral border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">{title}</p>
                            <p className="text-3xl font-semibold text-foreground">{value}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-tertiary ${color}`}>
                            <Icon className="w-6 h-6" strokeWidth={2} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
