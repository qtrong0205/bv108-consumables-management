
---

# Hệ thống Quản lý Vật tư Y tế - Bệnh viện TWQĐ 108

Ứng dụng web quản lý vật tư y tế dành cho Bệnh viện Trung ương Quân đội 108, giúp theo dõi, quản lý và giám sát vật tư y tế một cách hiệu quả và chính xác.

---

## 📋 Mục lục

* [Tổng quan](#-tổng-quan)
* [Tính năng](#-tính-năng)
* [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
* [Cài đặt](#-cài-đặt)
* [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
* [Cấu trúc dự án](#-cấu-trúc-dự-án)

---

## 🏥 Tổng quan

Hệ thống Quản lý Vật tư Y tế là giải pháp số hóa quy trình quản lý vật tư tiêu hao tại bệnh viện, bao gồm:

* Quản lý danh mục vật tư y tế
* Lập kế hoạch dự trù vật tư theo nhu cầu
* Phê duyệt và theo dõi quy trình gọi hàng
* Thống kê, báo cáo tổng quan

---

## ✨ Tính năng

### 1. Trang Tổng quan (Dashboard)

* Hiển thị thống kê tổng quan về vật tư
* Biểu đồ trực quan về tình trạng tồn kho
* Cảnh báo vật tư sắp hết hạn hoặc cần bổ sung
* Theo dõi hoạt động gần đây

### 2. Danh mục Vật tư

* Quản lý danh sách vật tư y tế
* Tìm kiếm và lọc vật tư theo nhiều tiêu chí
* Phân loại vật tư theo nhóm, nhà thầu
* Xem chi tiết thông tin từng vật tư

### 3. Dự trù Vật tư

* Lập kế hoạch dự trù vật tư theo kỳ
* Nhập số lượng dự trù cho từng vật tư
* Quy trình phê duyệt dự trù (Duyệt / Từ chối / Sửa & Duyệt)
* Duyệt hàng loạt nhiều vật tư cùng lúc
* Lịch sử thay đổi và phê duyệt
* Lịch sử dự trù theo tháng

### 4. Gọi hàng

* Danh sách vật tư cần gọi hàng (từ dự trù đã duyệt)
* Chọn vật tư và gửi đơn đặt hàng đến nhà thầu
* Nhóm vật tư theo nhà thầu
* Lịch sử gọi hàng

---

## 🛠 Công nghệ sử dụng

* **Frontend Framework:** React 18 + TypeScript
* **Build Tool:** Vite
* **Styling:** TailwindCSS
* **UI Components:** Radix UI + shadcn/ui
* **Routing:** React Router DOM
* **Charts:** Recharts
* **Icons:** Lucide React

---

## 📦 Cài đặt

### Yêu cầu hệ thống

* Node.js phiên bản 18 trở lên
* npm hoặc yarn

### Các bước cài đặt

1. **Clone repository:**

```bash
git clone https://github.com/qtrong0205/bv108-consumables-management.git
cd bv108-consumables-management
```

2. **Cài đặt dependencies:**

```bash
npm install
```

3. **Chạy môi trường development:**

```bash
npm run dev
```

4. **Truy cập ứng dụng:**

Mở trình duyệt và truy cập:
[http://localhost:5173](http://localhost:5173)

5. **Build cho production:**

```bash
npm run build
```

---

## 📖 Hướng dẫn sử dụng

### Đăng nhập

* Sử dụng tài khoản được cấp để đăng nhập vào hệ thống
* Hệ thống hỗ trợ phân quyền theo vai trò người dùng

### Quy trình làm việc

1. **Xem tổng quan:** Truy cập Dashboard để nắm bắt tình hình vật tư
2. **Tra cứu vật tư:** Sử dụng trang Danh mục để tìm kiếm thông tin vật tư
3. **Lập dự trù:** Nhập số lượng dự trù và gửi phê duyệt
4. **Phê duyệt:** Người có thẩm quyền duyệt/từ chối dự trù
5. **Gọi hàng:** Vật tư đã duyệt sẽ chuyển sang trang Gọi hàng để đặt hàng

---

## 📁 Cấu trúc dự án

```
src/
├── components/          # Các component tái sử dụng
│   ├── ui/              # UI components (Button, Card, Dialog,...)
│   ├── forecast/        # Components cho trang Dự trù
│   └── orders/          # Components cho trang Gọi hàng
├── context/             # React Context (OrderContext,...)
├── data/                # Mock data và types
├── hooks/               # Custom hooks
├── layouts/             # Layout components
├── lib/                 # Utility functions
├── pages/               # Các trang chính
│   ├── Dashboard.tsx
│   ├── InventoryCatalog.tsx
│   ├── MaterialForecast.tsx
│   └── SupplierOrder.tsx
└── types/               # TypeScript type definitions
```


## 📄 Giấy phép

Dự án này được phát triển cho Bệnh viện TWQĐ 108.

---

**Bệnh viện Trung ương Quân đội 108**
Hệ thống Quản lý Vật tư Y tế

---

