package com.example.hotelbooking.dto;

import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;

public class UserAccountResponse {

    private String id;
    private String name;
    private String email;
    private Role role;
    private String gender;
    private String dateOfBirth;
    private String citizenId;
    private boolean emailVerified;
    private String emailVerifiedAt;

    public static UserAccountResponse fromUser(User user) {
        UserAccountResponse response = new UserAccountResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setGender(user.getGender());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setCitizenId(user.getCitizenId());
        response.setEmailVerified(Boolean.TRUE.equals(user.getEmailVerified()));
        response.setEmailVerifiedAt(user.getEmailVerifiedAt());
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(String citizenId) {
        this.citizenId = citizenId;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public void setEmailVerifiedAt(String emailVerifiedAt) {
        this.emailVerifiedAt = emailVerifiedAt;
    }
}
