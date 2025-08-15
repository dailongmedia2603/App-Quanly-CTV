import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ReportWidgetProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: number;
  changeType?: "week" | "month";
  onClick?: () => void;
}

const ReportWidget = ({ icon, title, value, change, changeType = 'week', onClick }: ReportWidgetProps) => {
  const isPositive = change !== undefined && change >= 0;
  return (
    <Card 
      className={cn("border-orange-200", onClick && "cursor-pointer hover:bg-orange-50 transition-colors")}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className="text-brand-orange">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <span className={cn("flex items-center mr-1", isPositive ? "text-green-500" : "text-red-500")}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(change)}%
            </span>
            so với {changeType === 'week' ? 'tuần' : 'tháng'} trước
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportWidget;