import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyUsageReport from "@/components/reports/DailyUsageReport";
import CompareSuppliesTab from "@/components/reports/CompareSuppliesTab";
import TenderProgressReport from "@/components/reports/TenderProgressReport";

type ReportTab = "daily-usage" | "tender-progress";

export default function Report() {
  const [activeTab, setActiveTab] = useState<ReportTab>("daily-usage");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Xem và xuất các báo cáo vật tư theo kỳ
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ReportTab)}
        className="w-full"
      >
        <Card className="bg-neutral border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              Chọn báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
              <TabsTrigger
                value="daily-usage"
                className="w-full px-4 py-3 text-sm leading-tight"
              >
                Mức sử dụng trung bình ngày & cảnh báo gọi hàng
              </TabsTrigger>
              <TabsTrigger
                value="tender-progress"
                className="w-full px-4 py-3 text-sm leading-tight"
              >
                Theo dõi tiến độ thực hiện thầu
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="w-full px-4 py-3 text-sm leading-tight"
              >
                So sánh
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="daily-usage" className="mt-0">
          <DailyUsageReport />
        </TabsContent>

        <TabsContent value="tender-progress" className="mt-0">
          <TenderProgressReport />
        </TabsContent>

        <TabsContent value="compare" className="mt-0">
          <CompareSuppliesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
