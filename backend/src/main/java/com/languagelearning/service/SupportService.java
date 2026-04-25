package com.languagelearning.service;

import com.languagelearning.dto.support.*;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mysql.*;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SupportCategoryRepository supportCategoryRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;

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
            String sort,
            int page,
            int size
    ) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Specification<SupportTicket> specification = Specification.where(null);

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

    // Admin gửi phản hồi vào ticket và có thể cập nhật trạng thái ticket trong cùng request.
    @Transactional
    public SupportTicketDetailDto replyTicketAsAdmin(String adminEmail, Integer ticketId, SupportReplyRequest request) {
        User admin = getUserByEmail(adminEmail);
        ensureAdminUser(admin);

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ticket: " + ticketId));

        SupportMessage adminMessage = new SupportMessage();
        adminMessage.setTicket(ticket);
        adminMessage.setSenderType(SupportMessage.SenderType.ADMIN);
        adminMessage.setMessage(request.getMessage().trim());
        supportMessageRepository.save(adminMessage);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            ticket.setStatus(parseStatus(request.getStatus()));
        } else if (ticket.getStatus() == SupportTicket.SupportStatus.OPEN) {
            ticket.setStatus(SupportTicket.SupportStatus.IN_PROGRESS);
        }

        supportTicketRepository.save(ticket);
        return toDetailDto(ticket);
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
        return toDetailDto(ticket);
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

    // Chuyển SupportTicket thành item dùng cho danh sách ticket.
    private SupportTicketListItemDto toListItemDto(SupportTicket ticket) {
        String latestMessage = supportMessageRepository.findTopByTicketIdOrderByCreatedAtDesc(ticket.getId())
                .map(SupportMessage::getMessage)
                .orElse("");

        return SupportTicketListItemDto.builder()
                .id(ticket.getId())
                .userId(ticket.getUser() != null ? ticket.getUser().getId() : null)
                .requesterName(ticket.getRequesterName())
                .requesterEmail(ticket.getRequesterEmail())
                .categoryId(ticket.getCategory().getId())
                .categoryName(ticket.getCategory().getName())
                .categoryDisplayName(ticket.getCategory().getDisplayName())
                .status(ticket.getStatus().name())
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
                .createdAt(ticket.getCreatedAt())
                .messages(messageDtos)
                .build();
    }
}
