package com.truew8.dto;

import java.util.List;

public record OcrUploadResponseDTO(
        List<OcrHoldingDTO> holdings
) {
}
