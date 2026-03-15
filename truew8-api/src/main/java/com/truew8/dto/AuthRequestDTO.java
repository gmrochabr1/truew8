package com.truew8.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequestDTO(
        @Email(message = "Email format is invalid")
        @NotBlank(message = "Email is required")
        @Size(max = 254, message = "Email must have at most 254 characters")
        String email,
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must have between 8 and 72 characters")
        String password
) {
}
