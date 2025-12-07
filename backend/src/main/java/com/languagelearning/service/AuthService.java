package com.languagelearning.service;

import com.languagelearning.entity.User;
import com.languagelearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    
    // TODO: Implement authentication logic
}

