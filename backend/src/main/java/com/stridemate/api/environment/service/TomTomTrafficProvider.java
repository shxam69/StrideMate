package com.stridemate.api.environment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.environment.dto.TrafficInfoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;

@Service
public class TomTomTrafficProvider implements TrafficProvider {

    private static final Logger log = LoggerFactory.getLogger(TomTomTrafficProvider.class);

    private final String apiKey;
    private final String mode;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TomTomTrafficProvider(
            @Value("${tomtom.api-key:}") String apiKey,
            @Value("${traffic.provider.mode:mock}") String mode) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.mode = mode != null ? mode.trim().toLowerCase() : "mock";

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(4000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public TrafficInfoDto getTrafficInfo(double latitude, double longitude) {
        if (!apiKey.isBlank() && "real".equalsIgnoreCase(mode)) {
            return fetchLiveTomTomTraffic(latitude, longitude);
        }

        if ("mock".equalsIgnoreCase(mode)) {
            // Mock Mode: Deterministic light congestion for local test stability
            return new TrafficInfoDto(
                    "LOW",
                    88,
                    "Minimal vehicle congestion in surrounding streets",
                    "TomTom (Mock Telemetry)",
                    true
            );
        }

        // When no API key is provided and mock is off:
        return TrafficInfoDto.unavailable("Live traffic provider API key not configured");
    }

    private TrafficInfoDto fetchLiveTomTomTraffic(double latitude, double longitude) {
        try {
            String url = String.format(
                    Locale.US,
                    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=%.5f,%.5f&unit=kmph&key=%s",
                    latitude,
                    longitude,
                    apiKey
            );

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode flow = root.path("flowSegmentData");

                if (!flow.isMissingNode()) {
                    double currentSpeed = flow.path("currentSpeed").asDouble(30.0);
                    double freeFlowSpeed = flow.path("freeFlowSpeed").asDouble(40.0);
                    double ratio = freeFlowSpeed > 0 ? (currentSpeed / freeFlowSpeed) : 1.0;

                    int score = (int) Math.round(Math.min(100.0, Math.max(10.0, ratio * 100.0)));
                    String level;
                    String description;

                    if (ratio >= 0.80) {
                        level = "LOW";
                        description = String.format(Locale.US, "Free-flowing traffic (avg %.0f km/h)", currentSpeed);
                    } else if (ratio >= 0.50) {
                        level = "MODERATE";
                        description = String.format(Locale.US, "Moderate congestion near roads (avg %.0f km/h)", currentSpeed);
                    } else {
                        level = "HEAVY";
                        description = String.format(Locale.US, "Heavy vehicle congestion (avg %.0f km/h)", currentSpeed);
                    }

                    return new TrafficInfoDto(level, score, description, "TomTom Live API", true);
                }
            }
        } catch (Exception e) {
            log.warn("TomTom Traffic query failed for lat={}, lon={}: {}", latitude, longitude, e.getMessage());
        }

        return TrafficInfoDto.unavailable("Traffic provider temporarily unreachable");
    }
}
