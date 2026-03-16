package com.truew8.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequestDTO(
        @Email(message = "{validation.auth.email.invalid}")
        @NotBlank(message = "{validation.auth.email.required}")
        @Size(max = 254, message = "{validation.auth.email.max}")
        String email,
        @NotBlank(message = "{validation.auth.password.required}")
        @Size(min = 8, max = 72, message = "{validation.auth.password.size}")
        String password
) {
}
