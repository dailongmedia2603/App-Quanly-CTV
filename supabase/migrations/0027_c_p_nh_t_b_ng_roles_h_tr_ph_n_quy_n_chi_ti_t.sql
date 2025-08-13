-- Thêm cột description và permissions vào bảng roles
ALTER TABLE public.roles
ADD COLUMN description TEXT,
ADD COLUMN permissions JSONB;

-- Cập nhật các vai trò hiện có với mô tả và quyền mặc định
-- Super Admin có toàn quyền, được đánh dấu bằng một cờ đặc biệt
UPDATE public.roles
SET 
  description = 'Toàn quyền quản trị hệ thống. Không thể chỉnh sửa.',
  permissions = '{"super_admin": true}'::jsonb
WHERE name = 'Super Admin';

-- Admin có quyền quản lý dữ liệu nhưng không quản lý người dùng
UPDATE public.roles
SET 
  description = 'Quản lý dữ liệu của tất cả người dùng, không có quyền quản lý tài khoản.',
  permissions = '{
    "find_customers": ["read"],
    "create_post": ["create"],
    "create_comment": ["create"],
    "customer_consulting": ["use"],
    "create_plan": ["read", "create", "update", "delete"],
    "income": ["read", "create", "update", "delete"],
    "config_scan_post": ["read", "update"],
    "config_content_ai": ["read", "update"],
    "config_create_plan": ["read", "update"],
    "documents": ["read", "create", "update", "delete"],
    "reports": ["read", "delete"],
    "account": [],
    "settings": []
  }'::jsonb
WHERE name = 'Admin';

-- User có quyền cơ bản trên dữ liệu của chính mình
UPDATE public.roles
SET 
  description = 'Quyền cơ bản, chỉ thao tác trên dữ liệu của chính mình.',
  permissions = '{
    "find_customers": ["read"],
    "create_post": ["create"],
    "create_comment": ["create"],
    "customer_consulting": ["use"],
    "create_plan": ["read", "create", "update", "delete"],
    "income": ["read", "create", "update", "delete"],
    "config_scan_post": ["read", "update"],
    "config_content_ai": [],
    "config_create_plan": [],
    "documents": ["read", "create", "update", "delete"],
    "reports": ["read", "delete"],
    "account": [],
    "settings": []
  }'::jsonb
WHERE name = 'User';