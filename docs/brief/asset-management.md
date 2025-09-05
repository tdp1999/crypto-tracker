# Feature: Asset Management (Quản lý Tài sản)

- **Ngày tạo:** 2025-08-31
- **Trạng thái:** In-Progress

## 1. Định hình (Shape-Up)

### Mục tiêu chính (Goal)

Cung cấp cho người dùng một công cụ để ghi lại, quản lý tài sản cá nhân và thiết lập các mục tiêu tài chính cho từng tài sản, đồng thời theo dõi tiến độ tổng thể.

### User Stories

- **Create:** Là một người dùng, tôi muốn thêm một tài sản mới và tùy chọn thiết lập một mục tiêu cho nó.
- **Read:** Là một người dùng, tôi muốn xem một bảng điều khiển tổng quan và danh sách chi tiết các tài sản của mình.
- **Update:** Là một người dùng, tôi muốn cập nhật thông tin và mục tiêu của một tài sản.
- **Delete:** Là một người dùng, tôi muốn xóa một tài sản.

### Phạm vi (Scope)

- **Trong phạm vi (In-Scope):**
    - CRUD cho `Asset` và `AssetTarget`.
    - `Asset` bao gồm: `name`, `currentValue`, `type`, `location`, `description`.
    - `AssetTarget` bao gồm: `targetValue`, `targetDate`.
    - Backend tự động tính toán: `proportion`, `progress`, và `status` (`DONE`/`IN_PROGRESS`).
- **Ngoài phạm vi (Out-of-Scope):**
    - Theo dõi lịch sử thay đổi giá trị.
    - Hỗ trợ đa tiền tệ.
    - Đính kèm file.

## 2. Thiết kế Kỹ thuật (Technical Design)

### Giao diện & Trải nghiệm Người dùng (UI/UX)

- Giao diện dạng dashboard với 2 khu vực chính:
    1.  **Tóm tắt Tổng quan:** Hiển thị các card về "Tổng giá trị tài sản", "Tiến độ chung" (progress bar), và "Phân bổ tài sản" (biểu đồ tròn).
    2.  **Danh sách Tài sản:** Dạng bảng (data table) với các cột: Tên, Giá trị, Tỷ trọng, Loại, Tiến độ (progress bar), Trạng thái, và Hành động (Edit/Delete).
- Luồng Thêm/Sửa sử dụng Modal để không làm gián đoạn trải nghiệm người dùng.

### Backend (NestJS)

- **Module:** `src/modules/asset/`
- **Database:**
    - Bảng `assets`: `id`, `userId`, `name`, `currentValue`, `type`, `location`, `description`.
    - Bảng `asset_targets`: `id`, `assetId` (one-to-one), `targetValue`, `targetDate`.
- **CQRS:**
    - Commands: `CreateAssetCommand`, `UpdateAssetCommand`, `DeleteAssetCommand`.
    - Queries: `ListUserAssetsQuery` (tính toán `proportion`, `progress`, `status`).

### Frontend (Angular)

- **Module:** `AssetManagementModule` (lazy-loaded).
- **Components:** `AssetDashboardComponent`, `AssetSummaryComponent`, `AssetListComponent` (sẽ render table), `AssetFormComponent` (trong Modal).
- **State Management:** `AssetsStateService` sử dụng `BehaviorSubject`.

### API Contract (REST)

- **`GET /assets`**: Endpoint chính, trả về `AssetDashboardDto`.
- **`POST /assets`**: Tạo asset mới.
- **`PATCH /assets/{id}`**: Cập nhật asset.
- **`DELETE /assets/{id}`**: Xóa asset.

## 3. Checklist Triển khai (Implementation)

### Bước 1: Backend (NestJS)

- [ ] **DB:** Tạo file migration cho 2 bảng `assets` và `asset_targets`.
- [ ] **DB:** Chạy migration để cập nhật database.
- [ ] **DOMAIN:** Định nghĩa `Asset` và `AssetTarget` entities trong `domain` layer.
- [ ] **CQRS:** Implement `CreateAssetCommand` và handler.
- [ ] **API:** Tạo `POST /assets` endpoint trong `AssetsController` và kết nối với command.
- [ ] **TEST:** Viết integration test cho endpoint tạo asset.
- [ ] **CQRS:** Implement `ListUserAssetsQuery` và handler (bao gồm logic tính toán).
- [ ] **API:** Tạo `GET /assets` endpoint và kết nối với query.
- [ ] **TEST:** Viết integration test cho endpoint lấy danh sách assets.
- [ ] **CQRS & API:** Implement các command và endpoint còn lại (`Update`, `Delete`).
- [ ] **TEST:** Viết test cho các endpoint còn lại.

### Bước 2: Frontend (Angular)

- [ ] **SETUP:** Tạo `AssetManagementModule` (lazy-loaded) và routing.
- [ ] **MODELS:** Tạo các interface `AssetDto` và `AssetDashboardDto`.
- [ ] **SERVICE:** Tạo `AssetsApiService` và implement phương thức `getAssetDashboard()`.
- [ ] **STATE:** Tạo `AssetsStateService` để quản lý state của dashboard.
- [ ] **COMPONENT (Layout):** Dựng layout cơ bản cho `AssetDashboardComponent`.
- [ ] **COMPONENT (Summary):** Xây dựng `AssetSummaryComponent` để hiển thị dữ liệu tổng quan.
- [ ] **COMPONENT (List):** Xây dựng `AssetListComponent` để hiển thị dữ liệu dưới dạng bảng.
- [ ] **COMPONENT (Form):** Xây dựng `AssetFormComponent` (Reactive Forms) bên trong một Modal.
- [ ] **INTEGRATION:** Kết nối các components với `AssetsStateService` và `AssetsApiService` để hoàn thiện luồng CRUD.
- [ ] **TEST:** Viết unit test cho các component chính (ví dụ: `AssetFormComponent`).

### Bước 3: Hoàn thiện

- [ ] **DOCS:** Cập nhật file OpenAPI/Swagger spec.
- [ ] **REVIEW:** Review tổng thể code của cả feature.
- [ ] **MERGE:** Merge code vào nhánh chính.
