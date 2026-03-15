package com.truew8.service;

public interface GeminiApiClient {

    String extractHoldingsJson(byte[] imageBytes, String mimeType);
}
