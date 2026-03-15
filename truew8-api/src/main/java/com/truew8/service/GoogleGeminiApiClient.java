package com.truew8.service;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GoogleGeminiApiClient implements GeminiApiClient {

    private static final String DEFAULT_MIME_TYPE = "image/png";

    private final String apiKey;
    private final String model;

    private volatile Client client;

    public GoogleGeminiApiClient(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-2.5-flash}") String model
    ) {
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String extractHoldingsJson(byte[] imageBytes, String mimeType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .build();

        Content content = Content.fromParts(
            Part.fromText("Analise esta imagem de uma carteira de investimentos. Extraia os ativos no seguinte formato JSON: [{\"ticker\": \"string\", \"quantity\": \"number\"}]. Se não tiver certeza de um ticker, ignore-o. Retorne apenas o JSON, sem markdown ou explicações."),
                Part.fromBytes(imageBytes, normalizeMimeType(mimeType))
        );

        try {
            GenerateContentResponse response = getClient().models.generateContent(model, content, config);
            return response.text();
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini extraction failed", ex);
        }
    }

    private String normalizeMimeType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return DEFAULT_MIME_TYPE;
        }
        return mimeType;
    }

    private Client getClient() {
        Client local = client;
        if (local == null) {
            synchronized (this) {
                local = client;
                if (local == null) {
                    local = Client.builder().apiKey(apiKey).build();
                    client = local;
                }
            }
        }
        return local;
    }
}
