import { Card, CardContent } from '@/components/ui/card';
import { StarIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    icon: StarIcon;
    color: string;
}

export default function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
    return (
        <Card className="bg-neutral border-border hover:shadow-md transition-shadow">
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
    );
}
