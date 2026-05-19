package com.example.hotelbooking.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.AuthActionToken;
import com.example.hotelbooking.model.AuthActionType;

public interface AuthActionTokenRepository extends MongoRepository<AuthActionToken, String> {

    Optional<AuthActionToken> findByToken(String token);

    void deleteByUserIdAndType(String userId, AuthActionType type);
}
