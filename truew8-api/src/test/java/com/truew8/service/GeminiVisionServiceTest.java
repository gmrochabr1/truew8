package com.truew8.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truew8.dto.OcrHoldingDTO;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class GeminiVisionServiceTest {

    @Mock
    private GeminiApiClient geminiApiClient;

    private GeminiVisionService geminiVisionService;

    @BeforeEach
    void setUp() {
        StaticMessageSource messageSource = new StaticMessageSource();
        java.util.Locale ptBr = java.util.Locale.forLanguageTag("pt-BR");
        java.util.Locale enUs = java.util.Locale.forLanguageTag("en-US");
        messageSource.addMessage("gemini.empty.response", enUs, "Empty Gemini response");
        messageSource.addMessage("gemini.empty.response", ptBr, "Empty Gemini response");
        messageSource.addMessage("gemini.response.not.array", enUs, "Gemini response is not a JSON array");
        messageSource.addMessage("gemini.response.not.array", ptBr, "Gemini response is not a JSON array");
        messageSource.addMessage("gemini.invalid.json", enUs, "Invalid Gemini JSON response");
        messageSource.addMessage("gemini.invalid.json", ptBr, "Invalid Gemini JSON response");
        MessageResolver messages = new MessageResolver(messageSource);
        geminiVisionService = new GeminiVisionService(geminiApiClient, new ObjectMapper(), messages);
    }

    @Test
    void shouldParseJsonResponseAndAggregateDuplicateTickers() {
        when(geminiApiClient.extractHoldingsJson(any(), anyString())).thenReturn(
                """
                [
                  {"ticker":"petr4","quantity":"100"},
                  {"ticker":"PETR4","quantity":50},
                  {"ticker":"VALE3","quantity":"75,5"},
                  {"ticker":"??","quantity":10},
                  {"ticker":"BBDC4","quantity":"abc"}
                ]
                """
        );

        List<OcrHoldingDTO> holdings = geminiVisionService.extractHoldingsFromImage(new byte[] {1, 2, 3});

        assertEquals(2, holdings.size());
        assertEquals("PETR4", holdings.get(0).ticker());
        assertEquals(new BigDecimal("150"), holdings.get(0).quantity());
        assertEquals("VALE3", holdings.get(1).ticker());
        assertEquals(new BigDecimal("75.5"), holdings.get(1).quantity());
    }

    @Test
    void shouldHandleMarkdownWrappedJson() {
        when(geminiApiClient.extractHoldingsJson(any(), anyString())).thenReturn(
            """
            ```json
            [{"ticker":"ITSA4","quantity":"10"}]
            ```
            """
        );

        List<OcrHoldingDTO> holdings = geminiVisionService.extractHoldingsFromImage(new byte[] {1});

        assertEquals(1, holdings.size());
        assertEquals("ITSA4", holdings.get(0).ticker());
    }

    @Test
    void shouldThrowWhenGeminiReturnsInvalidJson() {
        when(geminiApiClient.extractHoldingsJson(any(), anyString())).thenReturn("not-json");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> geminiVisionService.extractHoldingsFromImage(new byte[] {1})
        );

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatusCode());
        assertEquals("Invalid Gemini JSON response", exception.getReason());
    }
}
