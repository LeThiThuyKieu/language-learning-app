package com.languagelearning.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.mail.from-name:LionLearn Support}")
    private String fromName;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Gửi email OTP.
     * @param hasPassword true = đặt lại mật khẩu, false = thiết lập mật khẩu lần đầu
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, boolean hasPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            // Đưa mã OTP lên đầu tiêu đề để người dùng thấy ngay trên thông báo điện thoại
            helper.setSubject("[Lion] " + otp + (hasPassword ? " là mã đặt lại mật khẩu của bạn" : " là mã thiết lập mật khẩu của bạn"));
            helper.setText(buildOtpHtml(otp, hasPassword), true);

            mailSender.send(message);
            log.info("Đã gửi OTP tới: {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Gửi OTP thất bại tới {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildOtpHtml(String otp, boolean hasPassword) {
        String purpose = hasPassword ? "đặt lại mật khẩu" : "thiết lập mật khẩu";
        String purposeDetail = hasPassword
                ? "Sử dụng mã xác thực dưới đây để <strong style=\"color:#1f2937;\">đặt lại mật khẩu</strong> cho tài khoản của bạn."
                : "Sử dụng mã xác thực dưới đây để <strong style=\"color:#1f2937;\">thiết lập mật khẩu</strong> cho tài khoản của bạn lần đầu tiên.";
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
                    <tr><td align="center">
                      <table width="480" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(135deg,#f97316 0%%,#ea580c 100%%);padding:32px 40px;">
                            <p style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">🦁 Lion</p>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Bảo mật tài khoản</p>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:36px 40px;">

                            <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#111827;">
                              Chào bạn,
                            </p>
                            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.8;">
                              Chúng tôi nhận được yêu cầu <strong style="color:#ea580c;">%s</strong>
                              cho tài khoản của bạn. %s
                            </p>

                            <!-- OTP box -->
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                              <tr>
                                <td align="center" style="background:#fff7ed;border:2px dashed #fb923c;border-radius:14px;padding:28px 20px;">
                                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:1px;">Mã xác thực của bạn</p>
                                  <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:14px;color:#1f2937;font-family:'Courier New',Courier,monospace;line-height:1;">%s</p>
                                </td>
                              </tr>
                            </table>

                            <!-- Hiệu lực -->
                            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-align:center;">
                              Mã có hiệu lực trong <strong style="color:#dc2626;">5 phút</strong>
                            </p>

                            <!-- Cảnh báo -->
                            <table width="100%%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="background:#fef2f2;border-radius:10px;padding:14px 18px;">
                                  <p style="margin:0;font-size:12px;color:#991b1b;line-height:1.7;">
                                    ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này với bất kỳ ai.
                                    Lion sẽ không bao giờ chủ động hỏi mã xác thực của bạn.
                                  </p>
                                </td>
                              </tr>
                            </table>

                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
                            <p style="margin:0 0 2px;font-size:13px;color:#374151;">Trân trọng,</p>
                            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#ea580c;">Lion Learning Team</p>
                            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
                              Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email. Tài khoản của bạn vẫn an toàn.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(purpose, purposeDetail, otp);
    }

    /**
     * Gửi email phản hồi support tới user/guest sau khi admin reply.
     *
     * @param isFollowUp true nếu đây là lần reply thứ 2 trở đi
     */
    @Async
    public void sendSupportReply(String toEmail, String toName, String userQuestion,
                                  String adminReply, String category, boolean isFollowUp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);

            String subject = isFollowUp
                    ? "[LionLearn] Cập nhật mới cho yêu cầu hỗ trợ - " + category
                    : "[LionLearn] Phản hồi yêu cầu hỗ trợ - " + category;

            helper.setSubject(subject);
            helper.setText(buildHtmlBody(toName, userQuestion, adminReply, category, isFollowUp), true);

            mailSender.send(message);
            log.info("Đã gửi email {} tới: {}", isFollowUp ? "follow-up" : "phản hồi", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Gửi email thất bại tới {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildHtmlBody(String name, String userQuestion, String adminReply,
                                  String category, boolean isFollowUp) {
        String introLine = isFollowUp
                ? "Chúng tôi có thêm thông tin mới cập nhật cho yêu cầu của bạn:"
                : "Yêu cầu hỗ trợ của bạn trong danh mục <span style=\"background:#fff7ed;color:#ea580c;padding:2px 10px;border-radius:20px;font-weight:600;font-size:13px;\">%s</span> đã được phản hồi.".formatted(category);

        String replyLabel = isFollowUp ? "THÔNG TIN CẬP NHẬT" : "PHẢN HỒI TỪ ĐỘI NGŨ HỖ TRỢ";
        String replyLabelColor = isFollowUp ? "#0369a1" : "#ea580c";
        String replyBg = isFollowUp ? "#eff6ff" : "#fff7ed";
        String replyBorder = isFollowUp ? "#0ea5e9" : "#f97316";

        String questionBlock = """
                <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="background:#f9fafb;border-left:4px solid #d1d5db;border-radius:8px;padding:16px 20px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">Câu hỏi của bạn</p>
                      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">%s</p>
                    </td>
                  </tr>
                </table>
                """.formatted(escapeHtml(userQuestion));

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(135deg,#f97316 0%%,#ea580c 100%%);padding:32px 40px;">
                            <p style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">🦁 Lion</p>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Trung tâm hỗ trợ</p>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:36px 40px;">
                            <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#111827;">
                              Xin chào <strong>%s</strong>,
                            </p>
                            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.8;">
                              %s
                            </p>

                            %s

                            <!-- Phản hồi -->
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                              <tr>
                                <td style="background:%s;border-left:4px solid %s;border-radius:8px;padding:16px 20px;">
                                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:%s;text-transform:uppercase;letter-spacing:0.8px;">%s</p>
                                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">%s</p>
                                </td>
                              </tr>
                            </table>

                            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                              Nếu bạn cần hỗ trợ thêm, hãy truy cập
                              <a href="%s/help" style="color:#ea580c;text-decoration:none;font-weight:600;">Trung tâm trợ giúp</a>.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
                            <p style="margin:0 0 2px;font-size:13px;color:#374151;">Trân trọng,</p>
                            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#ea580c;">Lion Learning Team</p>
                            <p style="margin:0;font-size:11px;color:#9ca3af;">
                              © 2025 Lion Learning · Email này được gửi tự động, vui lòng không reply trực tiếp.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                name,
                introLine,
                questionBlock,
                replyBg, replyBorder,
                replyLabelColor, replyLabel,
                escapeHtml(adminReply),
                frontendUrl
        );
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("\n", "<br/>");
    }
}
