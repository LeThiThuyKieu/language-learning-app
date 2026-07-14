/**
 * Trích xuất message người dùng có thể đọc từ lỗi API.
 *
 * Spring Boot đôi khi trả về dạng: "409 CONFLICT Test đã tồn tại"
 * Hàm này bỏ phần mã HTTP ở đầu và chỉ giữ lại phần mô tả.
 *
 * @param err       - lỗi bắt được từ catch
 * @param fallback  - thông báo mặc định nếu không tìm được message
 */
export function getErrorMessage(err: unknown, fallback = "Đã xảy ra lỗi, vui lòng thử lại"): string {
    const raw =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

    if (!raw) return fallback;

    // Bỏ phần "409 CONFLICT " hoặc "400 BAD_REQUEST " ở đầu chuỗi
    const cleaned = raw.replace(/^\d{3}\s+\S+\s*/i, "").trim();

    return cleaned || fallback;
}
