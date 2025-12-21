import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const topItems = [
    { name: 'Găng tay phẫu thuật', usage: 1250 },
    { name: 'Ống tiêm 5ml', usage: 980 },
    { name: 'Gạc y tế', usage: 850 },
    { name: 'Catheter tĩnh mạch', usage: 720 },
    { name: 'Bông cồn', usage: 650 },
];

export default function TopItemsTable() {
    return (
        <Card className="bg-neutral border-border">
            <CardHeader>
                <CardTitle className="text-foreground">Vật tư tiêu thụ nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                                <div className="mt-1 h-2 bg-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${(item.usage / 1250) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <span className="ml-4 text-sm font-medium text-muted-foreground">{item.usage}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
