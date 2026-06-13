import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicalSupply } from "@/types";
import { ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";

interface InventoryTableProps {
  items: MedicalSupply[];
  lowStockItems: string[];
  onRowClick: (item: MedicalSupply) => void;
  enableGrouping?: boolean;
}

// Type định nghĩa nhóm vật tư có quan hệ cha-con
type SupplyGroup = {
  key: string;
  parentTypeName: string;
  parentItem: MedicalSupply;
  childItems: MedicalSupply[];
  allItems: MedicalSupply[];
};

// Hàm kiểm tra có phải là item con (có phần sau dấu chấm thứ 5)
const isChildItem = (typeName?: string): boolean => {
  if (!typeName) return false;
  const parts = typeName.split(".");
  return parts.length > 5;
};

// Hàm kiểm tra có phải là item cha (đúng 5 phần và không có mã hiệu)
const isParentItem = (typeName?: string, maHieu?: string): boolean => {
  if (!typeName) return false;
  const parts = typeName.split(".");
  // Parent: có đúng 5 phần và KHÔNG có mã hiệu
  return parts.length === 5 && (!maHieu || maHieu.trim() === "");
};

// Hàm nhóm vật tư theo quan hệ cha-con
const groupSuppliesByParent = (
  items: MedicalSupply[],
): (MedicalSupply | SupplyGroup)[] => {
  const parentMap = new Map<string, SupplyGroup>();
  const processedIds = new Set<number>();

  // Bước 1: Tìm các vật tư cha và các con của nó
  items.forEach((item) => {
    // Kiểm tra nếu đây là vật tư cha (5 phần + không có mã hiệu)
    if (isParentItem(item.typeName, item.maHieu)) {
      const parentTypeName = item.typeName!;

      // Tìm tất cả vật tư con có mã bắt đầu bằng mã cha
      const childItems = items.filter(
        (other) =>
          other.id !== item.id &&
          other.typeName?.startsWith(parentTypeName + ".") &&
          isChildItem(other.typeName),
      );

      // Nếu có vật tư con, tạo group
      if (childItems.length > 0) {
        parentMap.set(parentTypeName, {
          key: parentTypeName,
          parentTypeName,
          parentItem: item,
          childItems,
          allItems: childItems,
        });

        // Đánh dấu parent và children đã được xử lý
        processedIds.add(item.id);
        childItems.forEach((child) => processedIds.add(child.id));
      }
    }
  });

  // Bước 2: Merge groups với các item chưa được xử lý
  const result: (MedicalSupply | SupplyGroup)[] = [];

  // Thêm tất cả groups
  parentMap.forEach((group) => {
    result.push(group);
  });

  // Thêm các item chưa được xử lý (ungrouped items)
  items.forEach((item) => {
    if (!processedIds.has(item.id)) {
      result.push(item);
    }
  });

  return result;
};

export default function InventoryTable({
  items,
  lowStockItems,
  onRowClick,
  enableGrouping = true,
}: InventoryTableProps) {
  const isLowStock = (maVtyt: string) => lowStockItems.includes(maVtyt);
  const isOutOfStock = (item: MedicalSupply) =>
    typeof item.soLuongTon === "number" && item.soLuongTon === 0;

  // Helper để hiển thị giá trị hoặc để trống
  const displayValue = (value: any) => value || "";

  // State cho expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = React.useRef(false);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  useEffect(() => {
    const tableScrollElement = tableScrollRef.current;
    if (!tableScrollElement) return;

    const updateScrollWidth = () => {
      setTableScrollWidth(tableScrollElement.scrollWidth);
    };

    updateScrollWidth();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateScrollWidth);
    observer.observe(tableScrollElement);

    return () => observer.disconnect();
  }, [items, enableGrouping]);

  const handleTopScroll = () => {
    const topScrollElement = topScrollRef.current;
    const tableScrollElement = tableScrollRef.current;
    if (
      !topScrollElement ||
      !tableScrollElement ||
      isSyncingScrollRef.current
    ) {
      return;
    }

    isSyncingScrollRef.current = true;
    tableScrollElement.scrollLeft = topScrollElement.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const handleTableScroll = () => {
    const topScrollElement = topScrollRef.current;
    const tableScrollElement = tableScrollRef.current;
    if (
      !topScrollElement ||
      !tableScrollElement ||
      isSyncingScrollRef.current
    ) {
      return;
    }

    isSyncingScrollRef.current = true;
    topScrollElement.scrollLeft = tableScrollElement.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  // Nhóm vật tư nếu enableGrouping = true
  const displayData = useMemo(() => {
    if (!enableGrouping) {
      return items.map((item) => ({ type: "item" as const, data: item }));
    }
    const grouped = groupSuppliesByParent(items);
    return grouped.map((item) => {
      if ("parentTypeName" in item) {
        return { type: "group" as const, data: item as SupplyGroup };
      }
      return { type: "item" as const, data: item as MedicalSupply };
    });
  }, [items, enableGrouping]);

  // Toggle mở/đóng group
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Helper render item row
  const renderItemRow = (item: MedicalSupply, isIndented = false) => (
    <tr
      key={item.id}
      onClick={() => onRowClick(item)}
      className={`hover:bg-tertiary transition-colors cursor-pointer ${isOutOfStock(item) ? "bg-red-500/5" : isLowStock(item.maVtyt) ? "bg-warning/5" : ""} ${isIndented ? "bg-muted/20" : ""}`}
    >
      <td
        className={`px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap ${isIndented ? "pl-12" : ""}`}
      >
        {displayValue(item.maVtyt)}
      </td>
      <td className="px-4 py-3 text-xs text-foreground">
        <div>
          <p
            className="font-semibold text-sm break-words"
            title={displayValue(item.tenVtyt)}
          >
            {displayValue(item.tenVtyt)}
          </p>
          <p
            className="text-[11px] text-muted-foreground truncate"
            title={displayValue(item.hangSanXuat)}
          >
            {displayValue(item.hangSanXuat) || "N/A"}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-foreground">
        <div
          className="max-w-[330px] truncate whitespace-nowrap"
          title={displayValue(item.maHieu)}
        >
          {displayValue(item.maHieu)}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-foreground text-center">
        <div
          className="max-w-[56px] truncate mx-auto"
          title={displayValue(item.donViTinh)}
        >
          {displayValue(item.donViTinh)}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-foreground text-center font-medium">
        {item.tongThau || ""}
      </td>
      <td className="px-4 py-3 text-xs text-foreground text-right font-medium whitespace-nowrap">
        {(item.donGia || 0).toLocaleString("vi-VN")}
      </td>
      <td className="px-4 py-3 text-xs text-foreground text-center font-medium w-[128px]"></td>
      <td className="px-4 py-3 text-center">
        {isOutOfStock(item) ? (
          <Badge
            variant="outline"
            className="bg-red-500/20 text-red-600 border-red-500 text-xs w-fit mx-auto"
          >
            Đã hết
          </Badge>
        ) : isLowStock(item.maVtyt) ? (
          <Badge
            variant="outline"
            className="bg-warning/20 text-warning border-warning text-xs flex items-center gap-1 w-fit mx-auto"
          >
            <AlertTriangle className="w-3 h-3" />
            Sắp hết
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-green-500/20 text-green-600 border-green-500 text-xs"
          >
            Đủ hàng
          </Badge>
        )}
      </td>
    </tr>
  );

  return (
    <Card className="bg-neutral border-border">
      <CardContent className="p-0">
        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div className="divide-y divide-border">
            {displayData.map((dataItem) => {
              if (dataItem.type === "group") {
                const group = dataItem.data as SupplyGroup;
                const isExpanded = expandedGroups.has(group.key);
                return (
                  <React.Fragment key={`group-${group.key}`}>
                    {/* Group Header */}
                    <div
                      onClick={() => toggleGroup(group.key)}
                      className="p-4 hover:bg-tertiary transition-colors cursor-pointer active:bg-tertiary/80 bg-muted/30 flex items-center gap-2"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {group.parentItem?.tenVtyt || group.parentTypeName}
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1"
                        >
                          {group.allItems.length} vật tư
                        </Badge>
                      </div>
                    </div>

                    {/* Group Items */}
                    {isExpanded &&
                      group.allItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onRowClick(item)}
                          className={`p-4 hover:bg-tertiary transition-colors cursor-pointer active:bg-tertiary/80 pl-8 bg-muted/10 ${isOutOfStock(item) ? "bg-red-500/5" : isLowStock(item.maVtyt) ? "bg-warning/5" : ""}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">
                                  {displayValue(item.maVtyt)}
                                </span>
                                {isOutOfStock(item) ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-500/20 text-red-600 border-red-500 text-[10px] px-1.5 py-0 flex items-center gap-1"
                                  >
                                    Đã hết
                                  </Badge>
                                ) : (
                                  isLowStock(item.maVtyt) && (
                                    <Badge
                                      variant="outline"
                                      className="bg-warning/20 text-warning border-warning text-[10px] px-1.5 py-0 flex items-center gap-1"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      Sắp hết
                                    </Badge>
                                  )
                                )}
                              </div>
                              <p className="font-semibold text-[15px] text-foreground truncate">
                                {displayValue(item.tenVtyt)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {displayValue(item.hangSanXuat) || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {displayValue(item.hangSanXuat)} -{" "}
                                {displayValue(item.nuocSanXuat)}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-muted-foreground">
                                Tổng thầu:{" "}
                                <span className="text-foreground font-medium">
                                  {item.tongThau || ""}
                                </span>
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {(item.donGia || 0).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>
                      ))}
                  </React.Fragment>
                );
              } else {
                const item = dataItem.data as MedicalSupply;
                return (
                  <div
                    key={item.id}
                    onClick={() => onRowClick(item)}
                    className={`p-4 hover:bg-tertiary transition-colors cursor-pointer active:bg-tertiary/80 ${isOutOfStock(item) ? "bg-red-500/5" : isLowStock(item.maVtyt) ? "bg-warning/5" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {displayValue(item.maVtyt)}
                          </span>
                          {isOutOfStock(item) ? (
                            <Badge
                              variant="outline"
                              className="bg-red-500/20 text-red-600 border-red-500 text[10px] px-1.5 py-0 flex items-center gap-1"
                            >
                              Đã hết
                            </Badge>
                          ) : (
                            isLowStock(item.maVtyt) && (
                              <Badge
                                variant="outline"
                                className="bg-warning/20 text-warning border-warning text-[10px] px-1.5 py-0 flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Sắp hết
                              </Badge>
                            )
                          )}
                        </div>
                        <p className="font-semibold text-[15px] text-foreground truncate">
                          {displayValue(item.tenVtyt)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {displayValue(item.hangSanXuat) || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {displayValue(item.hangSanXuat)} -{" "}
                          {displayValue(item.nuocSanXuat)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Tổng thầu:{" "}
                          <span className="text-foreground font-medium">
                            {item.tongThau || ""}
                          </span>
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {(item.donGia || 0).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="mb-2 overflow-x-auto overflow-y-hidden"
          >
            <div
              aria-hidden="true"
              className="h-px"
              style={{
                width: tableScrollWidth > 0 ? `${tableScrollWidth}px` : "100%",
              }}
            />
          </div>
          <div
            ref={tableScrollRef}
            onScroll={handleTableScroll}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[800px]">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap w-[90px]">
                    Mã VT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium w-[480px]">
                    Tên vật tư
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap w-[400px]">
                    Mã hiệu
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap w-[78px]">
                    Đơn vị tính
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">
                    Tổng thầu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium whitespace-nowrap">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap w-[128px]">
                    Tổng số lượng sử dụng
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayData.map((dataItem) => {
                  if (dataItem.type === "group") {
                    const group = dataItem.data as SupplyGroup;
                    const isExpanded = expandedGroups.has(group.key);
                    return (
                      <React.Fragment key={`group-${group.key}`}>
                        {/* Group Header Row */}
                        <tr
                          className="bg-muted/30 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleGroup(group.key)}
                        >
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground">
                                  {group.parentItem?.tenVtyt ||
                                    group.parentTypeName}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Mã: {group.parentTypeName}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 ml-auto"
                              >
                                {group.allItems.length} vật tư
                              </Badge>
                            </div>
                          </td>
                        </tr>

                        {/* Group Items - Visible only when expanded */}
                        {isExpanded &&
                          group.allItems.map((item) =>
                            renderItemRow(item, true),
                          )}
                      </React.Fragment>
                    );
                  } else {
                    const item = dataItem.data as MedicalSupply;
                    return renderItemRow(item, false);
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>

        {displayData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy vật tư nào
          </div>
        )}
      </CardContent>
    </Card>
  );
}
