package com.truew8.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.truew8.entity.User;
import com.truew8.repository.UserRepository;
import com.truew8.service.GeminiApiClient;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OcrControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private GeminiApiClient geminiApiClient;

    private static final String EMAIL = "ocr.user@truew8.com";

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(EMAIL);
        user.setPasswordHash("hashed");
        user.setOcrCount(2);
        userRepository.save(user);

        Mockito.when(geminiApiClient.extractHoldingsJson(
                Mockito.any(byte[].class),
                Mockito.nullable(String.class)
        )).thenReturn("[{\"ticker\":\"PETR4\",\"quantity\":\"100\"}]");
    }

    @Test
    void shouldReturnForbiddenOnThirdUploadWhenLimitIsExhausted() throws Exception {
        byte[] payload = "fake-image".getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(multipart("/ocr/upload")
                        .file(new MockMultipartFile("image", "print.png", "image/png", payload))
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .with(user(EMAIL)))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/ocr/upload")
                        .file(new MockMultipartFile("image", "print.png", "image/png", payload))
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .with(user(EMAIL)))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/ocr/upload")
                        .file(new MockMultipartFile("image", "print.png", "image/png", payload))
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .with(user(EMAIL)))
                .andExpect(status().isForbidden());
    }
}
