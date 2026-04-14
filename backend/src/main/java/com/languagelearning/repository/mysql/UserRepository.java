package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByAuthProviderAndProviderUserId(User.AuthProvider authProvider, String providerUserId);
    boolean existsByEmail(String email);
}


