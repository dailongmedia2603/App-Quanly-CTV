import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award } from "lucide-react";

const CollaboratorRanking = () => {
  const dummyData = [
    { rank: 1, name: 'Hữu Long', commission: 12500000, contracts: 5 },
    { rank: 2, name: 'Minh Anh', commission: 9800000, contracts: 4 },
    { rank: 3, name: 'Trần Hùng', commission: 7200000, contracts: 3 },
  ];

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Xếp hạng Cộng tác viên</CardTitle>
        <CardDescription>
          Top các cộng tác viên có hiệu suất cao nhất trong tháng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Hạng</TableHead>
              <TableHead>Tên Cộng tác viên</TableHead>
              <TableHead className="text-right">Tổng hoa hồng</TableHead>
              <TableHead className="text-right">Số hợp đồng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyData.map(user => (
              <TableRow key={user.rank}>
                <TableCell className="font-bold text-lg">
                  {user.rank === 1 ? <Award className="text-yellow-500" /> : user.rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.commission)}
                </TableCell>
                <TableCell className="text-right">{user.contracts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CollaboratorRanking;