package com.truew8.service;

import com.truew8.dto.OcrHoldingDTO;
import com.truew8.entity.User;
import com.truew8.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OcrService {

    private final UserRepository userRepository;
    private final GeminiVisionService geminiVisionService;
    private final MessageResolver messages;

    public OcrService(UserRepository userRepository, GeminiVisionService geminiVisionService, MessageResolver messages) {
        this.userRepository = userRepository;
        this.geminiVisionService = geminiVisionService;
        this.messages = messages;
    }

    @Transactional
    public List<OcrHoldingDTO> extractHoldingsForUser(String email, byte[] imageBytes, String mimeType) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, messages.get("auth.user.not.found")));

        if (user.getOcrCount() == null || user.getOcrCount() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, messages.get("ocr.limit.reached"));
        }

        List<OcrHoldingDTO> holdings = geminiVisionService.extractHoldingsFromImage(imageBytes, mimeType);

        user.setOcrCount(user.getOcrCount() - 1);
        userRepository.save(user);

        return holdings;
    }
}
