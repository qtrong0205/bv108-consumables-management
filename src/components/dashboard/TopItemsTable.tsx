import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_MEDICAL_SUPPLIES } from '@/data/mockData';

export default function TopItemsTable() {
    // Lấy top 10 vật tư tiêu hao nhiều nhất
    const topItems = [...MOCK_MEDICAL_SUPPLIES]
        .sort((a, b) => b.soLuongTieuHao - a.soLuongTieuHao)
        .slice(0, 10);

    const maxUsage = topItems.length > 0 ? topItems[0].soLuongTieuHao : 1;

    return (
        <Card className="bg-neutral border-border">
            <CardHeader>
                <CardTitle className="text-foreground text-base">Top 10 vật tư tiêu hao nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {topItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-muted-foreground w-5">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate" title={item.tenVtyt}>
                                    {item.tenVtyt}
                                </p>
                                <div className="mt-1 h-2 bg-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${(item.soLuongTieuHao / maxUsage) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                {item.soLuongTieuHao.toLocaleString('vi-VN')}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
