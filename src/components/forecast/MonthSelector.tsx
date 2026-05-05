import React, { useMemo } from 'react';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  maxMonthsAhead?: number;
}

const CURRENT_DATE = new Date();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

const MONTHS_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  maxMonthsAhead = 12,
}) => {
  const months = useMemo(() => {
    const result: Array<{
      month: number;
      year: number;
      label: string;
      isCurrentMonth: boolean;
      isPastMonth: boolean;
      isFutureMonth: boolean;
    }> = [];

    // Generate all 12 months for current year, then future months
    for (let i = 1; i <= 12; i++) {
      const isCurrentMonth = i === CURRENT_MONTH && CURRENT_YEAR === CURRENT_YEAR;
      const isPastMonth = CURRENT_YEAR > CURRENT_YEAR || (CURRENT_YEAR === CURRENT_YEAR && i < CURRENT_MONTH);
      const isFutureMonth = CURRENT_YEAR < CURRENT_YEAR || (CURRENT_YEAR === CURRENT_YEAR && i > CURRENT_MONTH);

      result.push({
        month: i,
        year: CURRENT_YEAR,
        label: `${MONTHS_VI[i - 1]}`,
        isCurrentMonth,
        isPastMonth,
        isFutureMonth,
      });
    }

    // Add months for next year if needed
    if (maxMonthsAhead > 12) {
      const nextYearMonths = Math.min(maxMonthsAhead - 12, 12);
      for (let i = 1; i <= nextYearMonths; i++) {
        result.push({
          month: i,
          year: CURRENT_YEAR + 1,
          label: `${MONTHS_VI[i - 1]} '${String(CURRENT_YEAR + 1).slice(-2)}`,
          isCurrentMonth: false,
          isPastMonth: false,
          isFutureMonth: true,
        });
      }
    }

    return result;
  }, [maxMonthsAhead]);

  return (
    <div className="space-y-2">
      {/* Month selector - all on one line */}
      <div className="flex flex-wrap gap-1 items-center">
        {months.map((m) => {
          const isSelected = m.month === selectedMonth && m.year === selectedYear;
          const isPast = m.isPastMonth;
          const isCurrent = m.isCurrentMonth;

          return (
            <button
              key={`${m.month}-${m.year}`}
              onClick={() => {
                if (!isPast) {
                  onMonthChange(m.month, m.year);
                }
              }}
              disabled={isPast}
              className={`
                relative px-2 py-1 rounded text-xs font-medium
                transition-all duration-200 cursor-pointer whitespace-nowrap
                ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-700'
                    : isCurrent
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : isPast
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 border border-gray-200'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              title={isPast ? 'Không thể chỉnh sửa tháng đã qua' : undefined}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Info text */}
      <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-amber-100 border border-amber-300 rounded"></span>
          Tháng hiện tại
        </span>
      </div>
    </div>
  );
};

export default MonthSelector;
