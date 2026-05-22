# Website Expense Tracker

Ứng dụng quản lý chi tiêu cá nhân gồm `Frontend` React/Vite và backend `my-app` Next.js API Routes. Frontend cho phép nhập khoản chi, xem danh sách, lọc theo thời gian và tính tổng; backend nhận request, làm việc với Supabase và trả dữ liệu cho frontend.

## Demo

```txt
https://website-expense-tracker-f.vercel.app/
```

## Công Nghệ

- Frontend: React 19, Vite, CSS thuần
- Backend: Next.js 16 API Routes
- Database: Supabase
- Tooling: ESLint, npm

## Cấu Trúc Chính

```txt
Website_Expense-Tracker/
├── Frontend/              # React + Vite frontend
│   ├── src/App.jsx        # State chính, gọi API backend
│   ├── src/components/    # Form, bảng giao dịch, bộ lọc
│   ├── src/utils/         # Format tiền, lọc theo thời gian
│   └── env.example
│
├── my-app/                # Next.js backend
│   ├── app/api/config/    # Cấu hình Supabase client
│   ├── app/api/health/    # API kiểm tra kết nối
│   ├── app/api/task/      # API tạo task
│   ├── app/api/transactions/ # API giao dịch chi tiêu
│   └── env.example
│
└── docker-compose.yml
```

## Chức Năng Chính

- Thêm khoản chi tiêu gồm tên, số tiền, danh mục và ngày.
- Lưu giao dịch vào Supabase.
- Hiển thị danh sách giao dịch.
- Tính tổng chi tiêu toàn bộ và theo bộ lọc.
- Lọc theo ngày, tháng hoặc khoảng thời gian.
- Gom giao dịch theo ngày.
- Kiểm tra trạng thái API/database qua `/api/health`.
- Tạo task xác nhận sau khi thêm giao dịch.

## Luồng Hoạt Động

```txt
Frontend React
  -> fetch API backend
  -> Next.js API Route
  -> Supabase
  -> trả JSON về frontend
  -> cập nhật giao diện
```

## Environment

Backend tạo file `my-app/.env` từ `my-app/env.example`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Frontend tạo file `Frontend/.env` từ `Frontend/env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Lưu ý: `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở backend, không đưa vào frontend.

## Chạy Local

Chạy backend:

```bash
cd my-app
npm install
npm run dev
```

Backend chạy tại:

```txt
http://localhost:3000
```

Chạy frontend ở terminal khác:

```bash
cd Frontend
npm install
npm run dev
```

Frontend thường chạy tại:

```txt
http://localhost:5173
```

## API Chính

### `GET /api/health`

Kiểm tra backend có kết nối được Supabase không.

### `GET /api/transactions`

Lấy danh sách giao dịch.

### `POST /api/transactions`

Thêm giao dịch mới.

Body mẫu:

```json
{
  "title": "Mua đồ ăn",
  "amount": 120000,
  "category": "Ăn uống",
  "date": "2026-05-21",
  "createdAt": "2026-05-21T10:00:00.000Z"
}
```

### `POST /api/task`

Tạo task xác nhận sau khi thêm giao dịch.

## Build Và Kiểm Tra

Frontend:

```bash
cd Frontend
npm run lint
npm run build
```

Backend:

```bash
cd my-app
npm run lint
npm run build
```

## Ghi Chú

- Frontend gọi backend bằng `VITE_API_BASE_URL`.
- Backend kết nối Supabase trong `my-app/app/api/config/supabase.ts`.
- Các route chính hiện dùng Supabase, chưa dùng MySQL trong `my-app/app/lib/db.js`.
- Không commit file `.env`.

 
