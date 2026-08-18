package com.stridemate.api.environment.service;

import com.stridemate.api.environment.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EnvironmentService {

    private static final Logger log = LoggerFactory.getLogger(EnvironmentService.class);

    private final OpenMeteoClient openMeteoClient;
    private final OverpassPlacesClient overpassPlacesClient;
    private final EnvironmentScoringEngine scoringEngine;

    // Cache structure: Key = "lat_lon" (rounded to 2 decimal places), Value = CachedEntry
    private final Map<String, CachedEnvironment> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_SECONDS = 600; // 10 minutes

    private static class CachedEnvironment {
        final EnvironmentResponseDto response;
        final Instant expiresAt;

        CachedEnvironment(EnvironmentResponseDto response, Instant expiresAt) {
            this.response = response;
            this.expiresAt = expiresAt;
        }
    }

    @Autowired
    public EnvironmentService(
            OpenMeteoClient openMeteoClient,
            OverpassPlacesClient overpassPlacesClient,
            EnvironmentScoringEngine scoringEngine) {
        this.openMeteoClient = openMeteoClient;
        this.overpassPlacesClient = overpassPlacesClient;
        this.scoringEngine = scoringEngine;
    }

    public EnvironmentResponseDto getCurrentEnvironment(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);

        String cacheKey = String.format(Locale.US, "%.2f_%.2f", latitude, longitude);
        CachedEnvironment cached = cache.get(cacheKey);

        if (cached != null && Instant.now().isBefore(cached.expiresAt)) {
            log.debug("Returning cached environment data for key: {}", cacheKey);
            return cached.response;
        }

        // 1. Fetch live telemetry from Open-Meteo
        WeatherDto weather = openMeteoClient.fetchCurrentWeather(latitude, longitude);
        AirQualityDto airQuality = openMeteoClient.fetchCurrentAirQuality(latitude, longitude);
        Double uvIndex = openMeteoClient.fetchUvIndex(latitude, longitude);

        // 2. Deterministic Scoring
        EnvironmentScoringEngine.EvaluationResult evaluation = scoringEngine.evaluate(weather, airQuality, uvIndex);

        // 3. Query & Rank Nearby Spots
        List<RunningSpotDto> spots = overpassPlacesClient.findNearbyRunningSpots(latitude, longitude, evaluation.getScore());

        // 4. Assemble DTO
        EnvironmentResponseDto response = new EnvironmentResponseDto();
        response.setLocation(new LocationDto(latitude, longitude));
        response.setWeather(weather);
        response.setAirQuality(airQuality);
        response.setUvIndex(uvIndex);
        response.setCondition(evaluation.getCondition());
        response.setRunningScore(evaluation.getScore());
        response.setRecommendation(evaluation.getRecommendation());
        response.setNearbySpots(spots);

        // Store in cache
        cache.put(cacheKey, new CachedEnvironment(response, Instant.now().plusSeconds(CACHE_TTL_SECONDS)));

        return response;
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Invalid latitude: must be between -90 and 90.");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Invalid longitude: must be between -180 and 180.");
        }
    }
}
