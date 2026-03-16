package com.truew8.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truew8.dto.OcrHoldingDTO;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GeminiVisionService {

    private static final Pattern TICKER_PATTERN = Pattern.compile("^[A-Z0-9]{1,12}$");

    private final GeminiApiClient geminiApiClient;
    private final ObjectMapper objectMapper;
    private final MessageResolver messages;

    public GeminiVisionService(GeminiApiClient geminiApiClient, ObjectMapper objectMapper, MessageResolver messages) {
        this.geminiApiClient = geminiApiClient;
        this.objectMapper = objectMapper;
        this.messages = messages;
    }

    public List<OcrHoldingDTO> extractHoldingsFromImage(byte[] imageBytes) {
        return extractHoldingsFromImage(imageBytes, "image/png");
    }

    public List<OcrHoldingDTO> extractHoldingsFromImage(byte[] imageBytes, String mimeType) {
        String rawResponse = geminiApiClient.extractHoldingsJson(imageBytes, mimeType);
        return parseGeminiJson(rawResponse);
    }

    List<OcrHoldingDTO> parseGeminiJson(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, messages.get("gemini.empty.response"));
        }

        String normalized = stripMarkdownCodeFences(rawResponse.trim());

        try {
            JsonNode root = objectMapper.readTree(normalized);
            if (!root.isArray()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, messages.get("gemini.response.not.array"));
            }

            Map<String, BigDecimal> aggregated = new LinkedHashMap<>();
            for (JsonNode node : root) {
                String ticker = parseTicker(node.get("ticker"));
                BigDecimal quantity = parseQuantity(node.get("quantity"));

                if (ticker == null || quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                aggregated.merge(ticker, quantity, BigDecimal::add);
            }

            List<OcrHoldingDTO> holdings = new ArrayList<>();
            for (Map.Entry<String, BigDecimal> entry : aggregated.entrySet()) {
                holdings.add(new OcrHoldingDTO(entry.getKey(), entry.getValue()));
            }

            return holdings;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, messages.get("gemini.invalid.json"), ex);
        }
    }

    private String stripMarkdownCodeFences(String content) {
        String withoutJsonFence = content.replace("```json", "").replace("```JSON", "");
        return withoutJsonFence.replace("```", "").trim();
    }

    private String parseTicker(JsonNode tickerNode) {
        if (tickerNode == null || tickerNode.isNull() || !tickerNode.isTextual()) {
            return null;
        }

        String ticker = tickerNode.asText().trim().toUpperCase(Locale.ROOT);
        if (ticker.isBlank() || !TICKER_PATTERN.matcher(ticker).matches()) {
            return null;
        }

        return ticker;
    }

    private BigDecimal parseQuantity(JsonNode quantityNode) {
        if (quantityNode == null || quantityNode.isNull()) {
            return null;
        }

        if (quantityNode.isNumber()) {
            return quantityNode.decimalValue();
        }

        if (quantityNode.isTextual()) {
            String raw = quantityNode.asText().trim().replace(",", ".");
            if (raw.isBlank()) {
                return null;
            }
            try {
                return new BigDecimal(raw);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }
}
