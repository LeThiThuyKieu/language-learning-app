package com.languagelearning.dto;

import com.languagelearning.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Integer id;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private String status;
    private List<String> roles;

    public static UserDTO fromUser(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());
        dto.setStatus(user.getStatus().name());
        dto.setRoles(user.getRoles().stream()
                .map(role -> role.getRoleName())
                .collect(Collectors.toList()));
        return dto;
    }
}


