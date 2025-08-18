"use client"

import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthPickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
}

export function MonthPicker({ date, setDate }: MonthPickerProps) {
  const [year, setYear] = React.useState(date ? date.getFullYear() : new Date().getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  const handleMonthClick = (monthDate: Date) => {
    setDate(monthDate);
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear(year - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-[120px] font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear(year + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month) => (
          <Button
            key={month.toString()}
            variant={date && date.getMonth() === month.getMonth() && date.getFullYear() === year ? "default" : "ghost"}
            onClick={() => handleMonthClick(month)}
            className="capitalize"
          >
            {format(month, "MMM", { locale: vi })}
          </Button>
        ))}
      </div>
    </div>
  );
}