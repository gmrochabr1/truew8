package com.truew8.controller;

import com.truew8.dto.OcrUploadResponseDTO;
import com.truew8.service.OcrService;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/ocr")
public class OcrController {

    private static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024L * 1024L;

    private final OcrService ocrService;

    public OcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OcrUploadResponseDTO> upload(
            @RequestParam("image") MultipartFile image,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        if (image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image is required");
        }

        if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image exceeds 10MB limit");
        }

        try {
            OcrUploadResponseDTO response = new OcrUploadResponseDTO(
                    ocrService.extractHoldingsForUser(authentication.getName(), image.getBytes(), image.getContentType())
            );
            return ResponseEntity.ok(response);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image payload", ex);
        }
    }
}
