import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Wallet, Pencil, MoreHorizontal } from "lucide-react";

interface Contract {
  id: string;
  project_name: string;
  contract_value: number;
  status: 'ongoing' | 'completed' | 'not_started';
  start_date: string;
  total_paid: number;
}

interface ContractCardProps {
  contract: Contract;
  onViewPayments: (id: string) => void;
  onEdit: (contract: Contract) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const ContractCard = ({ contract, onViewPayments, onEdit }: ContractCardProps) => {
  const remaining = contract.contract_value - contract.total_paid;

  return (
    <Card className="border-orange-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-bold text-gray-800">{contract.project_name}</CardTitle>
          <Badge
            className={cn(
              "text-xs",
              contract.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
              contract.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-gray-100 text-gray-800 border-gray-200'
            )}
          >
            {contract.status === 'completed' ? 'Hoàn thành' : contract.status === 'ongoing' ? 'Đang chạy' : 'Chưa chạy'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Giá trị HĐ:</span>
          <span className="font-semibold">{formatCurrency(contract.contract_value)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Đã thanh toán:</span>
          <span className="font-semibold text-green-600">{formatCurrency(contract.total_paid)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Còn lại:</span>
          <span className="font-semibold text-red-600">{formatCurrency(remaining)}</span>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between items-center p-3">
        <p className="text-xs text-gray-500">
          Ngày bắt đầu: {format(new Date(contract.start_date), 'dd/MM/yyyy')}
        </p>
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="outline" onClick={() => onViewPayments(contract.id)}>
            <Wallet className="h-4 w-4 mr-2" /> Thanh toán
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(contract)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ContractCard;