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
        String logoUrl = frontendUrl + "/logo/lion.png";

        // Dòng mở đầu khác nhau tùy lần đầu hay follow-up
        String introLine = isFollowUp
                ? "Chúng tôi có thêm thông tin mới cập nhật cho bạn:"
                : "Yêu cầu hỗ trợ của bạn trong danh mục <span style=\"background:#fff7ed;color:#ea580c;padding:2px 10px;border-radius:20px;font-weight:600;font-size:13px;\">%s</span> đã được phản hồi.".formatted(category);

        String replyLabel = isFollowUp ? "Thông tin cập nhật" : "Phản hồi từ đội ngũ hỗ trợ";
        String replyLabelColor = isFollowUp ? "#0369a1" : "#ea580c";
        String replyBg = isFollowUp ? "#eff6ff" : "#fff7ed";
        String replyBorder = isFollowUp ? "#0ea5e9" : "#f97316";

        // Luôn hiển thị câu hỏi gốc của user ở cả email đầu và follow-up
        String questionBlock = """
                <div style="background:#f9fafb;border-left:4px solid #d1d5db;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">
                    Câu hỏi của bạn
                  </p>
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">%s</p>
                </div>
                """.formatted(escapeHtml(userQuestion));

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 40px;">
                            <table width="100%%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align:middle;">
                                  <img src="%s" alt="LionLearn"
                                       width="48" height="48"
                                       style="border-radius:12px;display:block;"/>
                                </td>
                                <td style="vertical-align:middle;padding-left:14px;">
                                  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">
                                    LionLearn
                                  </p>
                                  <p style="margin:2px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">
                                    Trung tâm hỗ trợ
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:36px 40px;">
                            <p style="margin:0 0 8px;font-size:16px;color:#374151;">
                              Xin chào <strong>%s</strong>,
                            </p>
                            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                              %s
                            </p>

                            %s

                            <!-- Phản hồi / Cập nhật -->
                            <div style="background:%s;border-left:4px solid %s;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
                              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:%s;text-transform:uppercase;letter-spacing:0.8px;">
                                %s
                              </p>
                              <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">%s</p>
                            </div>

                            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                              Nếu bạn cần hỗ trợ thêm, hãy truy cập
                              <a href="%s/help" style="color:#f97316;text-decoration:none;font-weight:600;">Trung tâm trợ giúp</a>.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                              © 2025 LionLearn · Email này được gửi tự động, vui lòng không reply trực tiếp.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                logoUrl,                // img src
                name,                   // Xin chào
                introLine,              // dòng giới thiệu
                questionBlock,          // block câu hỏi
                replyBg,                // background reply block
                replyBorder,            // border reply block
                replyLabelColor,        // màu label
                replyLabel,             // label text
                escapeHtml(adminReply), // nội dung reply
                frontendUrl             // link help
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
