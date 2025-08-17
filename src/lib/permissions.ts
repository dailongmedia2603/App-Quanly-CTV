export const permissionConfig = [
  { key: 'find_customers', name: 'Tìm khách hàng', actions: ['read'] },
  { key: 'create_post', name: 'Tạo bài viết', actions: ['create'] },
  { key: 'create_comment', name: 'Tạo comment', actions: ['create'] },
  { key: 'customer_consulting', name: 'Tư vấn khách hàng', actions: ['use'] },
  { key: 'create_quote', name: 'Tạo báo giá', actions: ['create'] },
  { key: 'create_plan', name: 'Tạo Plan', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'income', name: 'Thu nhập', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'public_services', name: 'Dịch vụ (Công khai)', actions: ['read'] },
  { key: 'config_scan_post', name: 'Cấu hình Quét Post', actions: ['read', 'update'] },
  { key: 'config_content_ai', name: 'Cấu hình Content AI', actions: ['read', 'update'] },
  { key: 'config_create_plan', name: 'Cấu hình Tạo Plan', actions: ['read', 'update'] },
  { key: 'config_quote', name: 'Cấu hình Báo giá', actions: ['read', 'update'] },
  { key: 'documents', name: 'Tài liệu', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'performance_reports', name: 'Báo cáo hiệu suất', actions: ['read'] },
  { key: 'account', name: 'Tài khoản', actions: ['read', 'create', 'update', 'delete', 'assign_roles'] },
  { key: 'settings', name: 'Settings', actions: ['read', 'update'] },
];

export const actionNames: Record<string, string> = {
  read: 'Xem',
  create: 'Tạo',
  update: 'Sửa',
  delete: 'Xóa',
  assign_roles: 'Phân quyền',
  use: 'Sử dụng',
};