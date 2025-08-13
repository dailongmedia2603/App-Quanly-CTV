import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface PermissionGuardProps {
  feature: string;
  action?: string;
  children?: React.ReactNode;
}

const PermissionGuard = ({ feature, action, children }: PermissionGuardProps) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(feature, action)) {
    // Chuyển hướng về trang an toàn nếu không có quyền
    return <Navigate to="/profile" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PermissionGuard;