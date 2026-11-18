package com.servicedesk.servicedesk_backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// STEP 1: DEFINE THE REQUEST DATA FOR ADMIN-CREATED AGENT ACCOUNTS
public record AdminCreateAgentRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name cannot exceed 100 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 190, message = "Email cannot exceed 190 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must contain 8 to 72 characters")
        String password
) {
}
