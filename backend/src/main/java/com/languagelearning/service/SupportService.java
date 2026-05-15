package com.languagelearning.service;

import com.languagelearning.dto.support.*;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mysql.*;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class SupportService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SupportCategoryRepository supportCategoryRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    // Lấy ticket còn mở (OPEN/IN_PROGRESS/RESOLVED) của user theo category — dùng cho chatbox suggest.
    @Transactional(readOnly = true)
    public List<SupportTicketListItemDto> getActiveTicketsByCategory(String email, Integer categoryId) {
        User user = getUserByEmail(email);
        List<SupportTicket.SupportStatus> openStatuses = List.of(
                SupportTicket.SupportStatus.OPEN,
                SupportTicket.SupportStatus.IN_PROGRESS,
                SupportTicket.SupportStatus.RESOLVED
        );
        return supportTicketRepository
                .findByUserIdAndCategoryIdAndSourceAndStatusIn(
                        user.getId(), categoryId, SupportTicket.TicketSource.CHAT, openStatuses)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toListItemDto)
                .toList();
    }

    // Lấy danh sách tất cả category hỗ trợ (dùng cho chatbox chọn category).
    @Transactional(readOnly = true)
    public List<SupportCategoryDto> getCategories() {
        return supportCategoryRepository.findAll().stream()
                .map(c -> SupportCategoryDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .displayName(c.getDisplayName())
                        .colorBg(c.getColorBg())
                        .colorText(c.getColorText())
                        .build())
                .toList();
    }

    // User gửi thêm tin nhắn vào ticket đang mở (follow-up message).
    @Transactional
    public SupportTicketDetailDto sendUserMessage(String email, Integer ticketId, SupportReplyRequest request) {
        User user = getUserByEmail(email);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        // Kiểm tra quyền sở hữu
        if (ticket.getUser() == null || !ticket.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền gửi tin nhắn vào ticket này");
        }

        // Không cho gửi nếu ticket đã đóng
        if (ticket.getStatus() == SupportTicket.SupportStatus.CLOSED) {
            throw new IllegalArgumentException("Ticket này đã đóng, không thể gửi thêm tin nhắn");
        }

        SupportMessage message = new SupportMessage();
        message.setTicket(ticket);
        message.setSenderType(SupportMessage.SenderType.USER);
        message.setMessage(request.getMessage().trim());
        supportMessageRepository.save(message);

        // Khi user nhắn tin mới → chuyển về OPEN để admin biết cần xử lý lại
        // (áp dụng cho cả RESOLVED và IN_PROGRESS)
        if (ticket.getStatus() == SupportTicket.SupportStatus.RESOLVED
                || ticket.getStatus() == SupportTicket.SupportStatus.IN_PROGRESS) {
            ticket.setStatus(SupportTicket.SupportStatus.OPEN);
            supportTicketRepository.save(ticket);
        }

        SupportTicketDetailDto result = toDetailDto(ticket);
        broadcastTicketUpdate(result);
        return result;
    }

    // Tạo ticket hỗ trợ mới cho user hiện tại và thêm tin nhắn đầu tiên từ user.
    @Transactional
    public SupportTicketDetailDto createTicketForUser(String email, SupportCreateTicketRequest request) {
        User user = getUserByEmail(email);
        SupportCategory category = supportCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy category hỗ trợ: " + request.getCategoryId()));

        String requesterName = resolveRequesterName(user);

        SupportTicket ticket = new SupportTicket();
        ticket.setUser(user);
        ticket.setRequesterEmail(user.getEmail());
        ticket.setRequesterName(requesterName);
        ticket.setCategory(category);
        ticket.setStatus(SupportTicket.SupportStatus.OPEN);
        ticket.setSource(parseSource(request.getSource()));
        ticket = supportTicketRepository.save(ticket);

        SupportMessage firstMessage = new SupportMessage();
        firstMessage.setTicket(ticket);
        firstMessage.setSenderType(SupportMessage.SenderType.USER);
        firstMessage.setMessage(request.getMessage().trim());
        supportMessageRepository.save(firstMessage);

        // Nếu chatbot đã match và trả lời → lưu bot response vào DB
        // Admin sẽ thấy cuộc hội thoại đầy đủ: USER → BOT → (admin có thể tiếp tục)
        if (request.getBotResponse() != null && !request.getBotResponse().isBlank()) {
            SupportMessage botMessage = new SupportMessage();
            botMessage.setTicket(ticket);
            botMessage.setSenderType(SupportMessage.SenderType.BOT);
            botMessage.setMessage(request.getBotResponse().trim());
            supportMessageRepository.save(botMessage);
        }

        SupportTicketDetailDto result = toDetailDto(ticket);
        broadcastTicketUpdate(result);
        return result;
    }

    // Tạo ticket hỗ trợ mới cho guest (chưa đăng nhập) với tên và email được cung cấp.
    @Transactional
    public SupportTicketDetailDto createTicketForGuest(SupportCreateTicketRequest request) {
        if (request.getGuestEmail() == null || request.getGuestEmail().isBlank()) {
            throw new IllegalArgumentException("Email là bắt buộc khi gửi hỗ trợ không đăng nhập");
        }
        if (request.getGuestName() == null || request.getGuestName().isBlank()) {
            throw new IllegalArgumentException("Tên là bắt buộc khi gửi hỗ trợ không đăng nhập");
        }

        SupportCategory category = supportCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy category hỗ trợ: " + request.getCategoryId()));

        SupportTicket ticket = new SupportTicket();
        ticket.setUser(null);
        ticket.setRequesterEmail(request.getGuestEmail().trim());
        ticket.setRequesterName(request.getGuestName().trim());
        ticket.setCategory(category);
        ticket.setStatus(SupportTicket.SupportStatus.OPEN);
        ticket.setSource(parseSource(request.getSource()));
        ticket = supportTicketRepository.save(ticket);

        SupportMessage firstMessage = new SupportMessage();
        firstMessage.setTicket(ticket);
        firstMessage.setSenderType(SupportMessage.SenderType.USER);
        firstMessage.setMessage(request.getMessage().trim());
        supportMessageRepository.save(firstMessage);

        return toDetailDto(ticket);
    }

    // Lấy danh sách ticket của user hiện tại theo thời gian tạo mới nhất.
    @Transactional(readOnly = true)
    public List<SupportTicketListItemDto> getMyTickets(String email) {
        User user = getUserByEmail(email);
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toListItemDto)
                .toList();
    }

    // Lấy chi tiết ticket của user hiện tại và kiểm tra quyền sở hữu ticket.
    @Transactional(readOnly = true)
    public SupportTicketDetailDto getMyTicketDetail(String email, Integer ticketId) {
        User user = getUserByEmail(email);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        if (ticket.getUser() == null || !ticket.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập ticket này");
        }

        return toDetailDto(ticket);
    }

    // Lấy danh sách ticket cho admin với filter trạng thái, category, keyword và sắp xếp theo thời gian.
    @Transactional(readOnly = true)
    public Page<SupportTicketListItemDto> getAdminTickets(
            String adminEmail,
            String status,
            Integer categoryId,
            String keyword,
            String source,
            String sort,
            int page,
            int size
    ) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Specification<SupportTicket> specification = Specification.where(null);

        // Filter theo source (CHAT / EMAIL) — quan trọng để phân biệt 2 trang admin
        if (source != null && !source.isBlank()) {
            SupportTicket.TicketSource parsedSource = parseSource(source);
            specification = specification.and((root, query, cb) -> cb.equal(root.get("source"), parsedSource));
        }

        if (status != null && !status.isBlank()) {
            SupportTicket.SupportStatus parsedStatus = parseStatus(status);
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), parsedStatus));
        }

        if (categoryId != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.join("category", JoinType.INNER).get("id"), categoryId));
        }

        if (keyword != null && !keyword.isBlank()) {
            String likeKeyword = "%" + keyword.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("requesterEmail")), likeKeyword),
                    cb.like(cb.lower(root.get("requesterName")), likeKeyword),
                    cb.like(cb.lower(root.join("category", JoinType.LEFT).get("displayName")), likeKeyword)
            ));
        }

        return supportTicketRepository.findAll(specification, pageable).map(this::toListItemDto);
    }

    // Lấy chi tiết ticket cho admin.
    @Transactional(readOnly = true)
    public SupportTicketDetailDto getAdminTicketDetail(String adminEmail, Integer ticketId) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        return toDetailDto(ticket);
    }

    // Admin xem ticket lần đầu → tự động chuyển từ OPEN sang IN_PROGRESS
    @Transactional
    public SupportTicketDetailDto viewTicketAsAdmin(String adminEmail, Integer ticketId) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        // Tự động chuyển từ OPEN sang IN_PROGRESS khi admin xem
        if (ticket.getStatus() == SupportTicket.SupportStatus.OPEN) {
            ticket.setStatus(SupportTicket.SupportStatus.IN_PROGRESS);
            supportTicketRepository.save(ticket);
            // Broadcast status mới — chỉ broadcast khi thực sự có thay đổi status
            SupportTicketDetailDto result = toDetailDto(ticket);
            broadcastTicketUpdate(result);
            return result;
        }

        // Không broadcast nếu status không thay đổi (tránh đẩy ticket lên đầu list)
        return toDetailDto(ticket);
    }

    // Admin gửi phản hồi vào ticket và có thể cập nhật trạng thái ticket trong cùng request.
    @Transactional
    public SupportTicketDetailDto replyTicketAsAdmin(String adminEmail, Integer ticketId, SupportReplyRequest request) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        // Đếm số lần admin đã reply TRƯỚC khi lưu message mới này
        long previousAdminReplies = supportMessageRepository
                .findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream()
                .filter(m -> m.getSenderType() == SupportMessage.SenderType.ADMIN)
                .count();

        SupportMessage adminMessage = new SupportMessage();
        adminMessage.setTicket(ticket);
        adminMessage.setSenderType(SupportMessage.SenderType.ADMIN);
        adminMessage.setMessage(request.getMessage().trim());
        supportMessageRepository.save(adminMessage);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            ticket.setStatus(parseStatus(request.getStatus()));
        } else {
            // Khi admin reply → chuyển sang IN_PROGRESS (không tự RESOLVED)
            // Admin phải bấm "Hoàn tất" để chuyển RESOLVED
            if (ticket.getStatus() == SupportTicket.SupportStatus.OPEN) {
                ticket.setStatus(SupportTicket.SupportStatus.IN_PROGRESS);
            }
        }

        supportTicketRepository.save(ticket);

        // Chỉ gửi email thông báo nếu ticket đến từ form email (không gửi cho chat)
        if (ticket.getSource() == SupportTicket.TicketSource.EMAIL) {
            String userQuestion = supportMessageRepository
                    .findTopByTicketIdAndSenderTypeOrderByCreatedAtAsc(ticket.getId(), SupportMessage.SenderType.USER)
                    .map(SupportMessage::getMessage)
                    .orElse("");

            emailService.sendSupportReply(
                    ticket.getRequesterEmail(),
                    ticket.getRequesterName(),
                    userQuestion,
                    request.getMessage().trim(),
                    ticket.getCategory().getDisplayName(),
                    previousAdminReplies > 0
            );
        }

        SupportTicketDetailDto result = toDetailDto(ticket);
        broadcastTicketUpdate(result);
        return result;
    }

    // Admin cập nhật trạng thái ticket mà không cần gửi tin nhắn phản hồi.
    @Transactional
    public SupportTicketDetailDto updateTicketStatusAsAdmin(String adminEmail, Integer ticketId, SupportUpdateStatusRequest request) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        ticket.setStatus(parseStatus(request.getStatus()));
        supportTicketRepository.save(ticket);
        SupportTicketDetailDto result = toDetailDto(ticket);
        broadcastTicketUpdate(result);
        return result;
    }

    // Broadcast cập nhật ticket tới tất cả subscriber WebSocket.
    private void broadcastTicketUpdate(SupportTicketDetailDto ticket) {
        log.info("[WS] Broadcasting ticket {} to /topic/support/{}", ticket.getId(), ticket.getId());
        messagingTemplate.convertAndSend("/topic/support/" + ticket.getId(), ticket);

        SupportTicket entity = supportTicketRepository.findById(ticket.getId()).orElse(null);
        if (entity != null) {
            SupportTicketListItemDto listItem = toListItemDto(entity);
            log.info("[WS] Broadcasting list update for ticket {} (source={}, status={}) to /topic/support/list",
                    ticket.getId(), listItem.getSource(), listItem.getStatus());
            messagingTemplate.convertAndSend("/topic/support/list", listItem);
        }
    }
    // Lấy user theo email từ token hiện tại.
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user với email: " + email));
    }

    // Kiểm tra user hiện tại có quyền admin hay không.
    private void ensureAdminUser(User user) {
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> "ADMIN".equalsIgnoreCase(role.getRoleName()));
        if (!isAdmin) {
            throw new IllegalArgumentException("Bạn không có quyền admin");
        }
    }

    // Resolve tên hiển thị của người gửi từ UserProfile, fallback về phần trước @ của email.
    private String resolveRequesterName(User user) {
        return userProfileRepository.findByUserId(user.getId())
                .map(UserProfile::getFullName)
                .filter(name -> name != null && !name.isBlank())
                .orElseGet(() -> {
                    String email = user.getEmail();
                    int at = email.indexOf('@');
                    return at > 0 ? email.substring(0, at) : email;
                });
    }

    // Parse chuỗi status từ request về enum nội bộ của ticket.
    private SupportTicket.SupportStatus parseStatus(String status) {
        try {
            return SupportTicket.SupportStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Trạng thái ticket không hợp lệ: " + status);
        }
    }

    // Parse chuỗi source, mặc định EMAIL nếu null/blank/không hợp lệ.
    private SupportTicket.TicketSource parseSource(String source) {
        if (source == null || source.isBlank()) return SupportTicket.TicketSource.EMAIL;
        try {
            return SupportTicket.TicketSource.valueOf(source.trim().toUpperCase());
        } catch (Exception ex) {
            return SupportTicket.TicketSource.EMAIL;
        }
    }

    // Chuyển SupportTicket thành item dùng cho danh sách ticket.
    // latestMessage là tin nhắn mới nhất trong hội thoại (USER hoặc ADMIN).
    private SupportTicketListItemDto toListItemDto(SupportTicket ticket) {
        List<SupportMessage> messages = supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());

        // Lấy tin nhắn mới nhất
        String latestMessage = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getMessage();

        return SupportTicketListItemDto.builder()
                .id(ticket.getId())
                .userId(ticket.getUser() != null ? ticket.getUser().getId() : null)
                .requesterName(ticket.getRequesterName())
                .requesterEmail(ticket.getRequesterEmail())
                .categoryId(ticket.getCategory().getId())
                .categoryName(ticket.getCategory().getName())
                .categoryDisplayName(ticket.getCategory().getDisplayName())
                .status(ticket.getStatus().name())
                .source(ticket.getSource().name())
                .createdAt(ticket.getCreatedAt())
                .latestMessage(latestMessage)
                .build();
    }

    // Chuyển SupportTicket thành DTO chi tiết kèm toàn bộ hội thoại của ticket.
    private SupportTicketDetailDto toDetailDto(SupportTicket ticket) {
        List<SupportMessageDto> messageDtos = supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream()
                .map(msg -> SupportMessageDto.builder()
                        .senderType(msg.getSenderType().name())
                        .message(msg.getMessage())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .toList();

        return SupportTicketDetailDto.builder()
                .id(ticket.getId())
                .userId(ticket.getUser() != null ? ticket.getUser().getId() : null)
                .requesterName(ticket.getRequesterName())
                .requesterEmail(ticket.getRequesterEmail())
                .categoryId(ticket.getCategory().getId())
                .categoryName(ticket.getCategory().getName())
                .categoryDisplayName(ticket.getCategory().getDisplayName())
                .status(ticket.getStatus().name())
                .source(ticket.getSource().name())
                .createdAt(ticket.getCreatedAt())
                .messages(messageDtos)
                .build();
    }
}
