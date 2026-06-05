# DB Migration & API Changes — `it_lab_room` (2026-06-04)

Tóm tắt:
- Đã thay DB cũ bằng schema mới (`it_lab_room`).
- Đã cập nhật code để tương thích: `src/config/db.js`, một số `service` và `controller`.
- Server đã khởi chạy và kiểm thử cơ bản (GET `mon_hoc`, GET `thiet_bi`) trả về dữ liệu.

Các thay đổi quan trọng (file đã chỉnh sửa):
- `src/config/db.js`
  - Giá trị mặc định `DB_NAME` đổi sang `it_lab_room`.
- `src/services/authService.js`
  - SQL login dùng `nd.email` và `nd.ma_vai_tro` thay cho `tai_khoan`/`vai_tro_id`.
  - Token payload: `id`, `email`, `ho_ten`, `ma_vai_tro`, `role`.
- `src/services/categoryService.js`
  - `addThietBi` sử dụng cột mới `ten_thiet_bi`, `so_luong`.
- `src/services/roomService.js`
  - `addMayTinh` chèn vào cột `ma_may, ma_qr, dia_chi_ip, ma_phong, ma_cau_hinh, trang_thai`.
- `src/services/scheduleService.js`
  - Truy vấn lịch chuyển sang `lich_su_dung_phong_may`.
  - Ghi đặt phòng vào `dat_phong_may` (cột `ma_giang_vien`, `ma_phong`, `ngay_dat`, `trang_thai_duyet`).
- `src/controllers/*` (auth, category, room, schedule)
  - Cập nhật để chấp nhận tên trường request mới (ví dụ `email`, `ten_thiet_bi`, `dia_chi_ip`, `ma_phong`, `ma_cau_hinh`, `ma_nguoi_dung`).

Endpoint và mapping (cần cập nhật frontend):

1) POST /api/login
- Trước: `{ "tai_khoan": "...", "mat_khau": "..." }`
- Bây giờ: `{ "email": "user@example.com", "mat_khau": "password" }`
- Response: giống cũ nhưng token payload chứa `email` và `ma_vai_tro`.

2) POST /api/thiet-bi
- Trước: `{ "ten_tb": "Máy chiếu", "so_luong_tong": 2 }`
- Bây giờ: `{ "ten_thiet_bi": "Máy chiếu", "so_luong": 2 }`
- Bảng DB: `thiet_bi(ten_thiet_bi, so_luong)`

3) POST /api/may-tinh
- Trước: `{ "ma_may": "M01", "ip_may": "192.168.x.x", "he_dieu_hanh": "Windows", "phong_may_id": 1, "cau_hinh_id": 2 }`
- Bây giờ: `{ "ma_may": "M01", "dia_chi_ip": "192.168.x.x", "ma_phong": 1, "ma_cau_hinh": 2, "he_dieu_hanh": "Windows" }`
- Lưu ý: `he_dieu_hanh` hiện không được lưu vào cột riêng trong `may_tinh` (chỉ lưu `dia_chi_ip`, `ma_phong`, `ma_cau_hinh`).
- Response: `{ success: true, message: 'Thêm máy tính thành công', qr_code: '...' }`

4) GET /api/schedule/list
- Query params mới: `tuan_hoc`, `ma_lop`, `ma_nguoi_dung`
- Hệ thống mapping: tìm trong `lich_su_dung_phong_may`, liên kết `ma_phong`, `ma_lop`, `ma_giang_vien` -> `nguoi_dung`.
- `tuan_hoc` có thể là `ma_cai_dat_thoi_gian` (id) hoặc một ngày cụ thể (`ngay_hoc_cu_the`).

5) POST /api/schedule/book
- Trước: `{ "ngay_yeu_cau": "2026-06-10", "nguoi_dung_id": 3, "phong_may_id": 2 }`
- Bây giờ: `{ "ngay_yeu_cau": "2026-06-10", "ma_nguoi_dung": 3, "ma_phong": 2 }`
- Hành vi: nếu `ma_nguoi_dung` trỏ tới `giang_vien.ma_nguoi_dung`, hệ thống sẽ ghi `ma_giang_vien` tương ứng vào `dat_phong_may`.
- `trang_thai_duyet` mặc định lưu là `pending`.

Ghi chú kỹ thuật / khuyến nghị:
- Frontend cần cập nhật các form/login/booking để gửi trường mới (`email`, `ten_thiet_bi`, `so_luong`, `dia_chi_ip`, `ma_phong`, `ma_cau_hinh`, `ma_nguoi_dung`).
- Nếu muốn giữ tương thích ngược, có thể thêm mapping nhận `tai_khoan`/`ten_tb` v.v. rồi chuyển nội bộ sang tên mới.
- Kiểm tra các endpoint khác nếu frontend còn dùng `lop_hoc_id`, `tai_khoan`, `ip_may` trực tiếp.

Kiểm thử đã chạy:
- Server khởi động: `http://localhost:8001`.
- `getMonHoc()` trả về 3 bản ghi.
- `getThietBi()` trả về 3 bản ghi.

Các bước tiếp theo đề xuất:
- Xác nhận với frontend team về các tên trường mới.
- Commit & PR các thay đổi.
- Chạy test API trên môi trường staging.

Nếu đồng ý, tôi có thể tạo PR và/hoặc cập nhật README API chi tiết hơn.
