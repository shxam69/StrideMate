package com.stridemate.api.environment.service;

import com.stridemate.api.environment.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class SmartMapService {

    private final EnvironmentService environmentService;
    private final TrafficProvider trafficProvider;
    private final OverpassPlacesClient placesClient;

    @Autowired
    public SmartMapService(
            EnvironmentService environmentService,
            TrafficProvider trafficProvider,
            OverpassPlacesClient placesClient) {
        this.environmentService = environmentService;
        this.trafficProvider = trafficProvider;
        this.placesClient = placesClient;
    }

    public SmartMapResponseDto getSmartRunningMap(double latitude, double longitude) {
        // 1. Fetch live environment data (Weather, AQI, UV, base environment score)
        EnvironmentResponseDto env = environmentService.getCurrentEnvironment(latitude, longitude);

        // 2. Fetch traffic condition
        TrafficInfoDto traffic = trafficProvider.getTrafficInfo(latitude, longitude);

        // 3. Fetch nearby candidate places
        List<RunningSpotDto> rawSpots = placesClient.findNearbyRunningSpots(latitude, longitude, env.getRunningScore());

        // 4. Calculate traffic-aware running suitability for each spot
        List<SmartRunningSpotDto> smartSpots = new ArrayList<>();

        for (RunningSpotDto raw : rawSpots) {
            SmartRunningSpotDto spot = evaluateSpot(raw, env, traffic, latitude, longitude);
            smartSpots.add(spot);
        }

        // Sort descending by final suitability score
        smartSpots.sort((a, b) -> Double.compare(b.getSuitabilityScore(), a.getSuitabilityScore()));

        // Identify Best Place to Run
        SmartRunningSpotDto bestPlace = null;
        if (!smartSpots.isEmpty()) {
            SmartRunningSpotDto topCandidate = smartSpots.get(0);
            if (topCandidate.getSuitabilityScore() >= 50.0 && !"AVOID".equalsIgnoreCase(env.getCondition())) {
                bestPlace = topCandidate;
            }
        }

        SmartMapResponseDto response = new SmartMapResponseDto();
        response.setUserLocation(new LocationDto(latitude, longitude));
        response.setOverallCondition(env.getCondition());
        response.setOverallRunningScore(env.getRunningScore());
        response.setSummaryRecommendation(env.getRecommendation());
        response.setWeather(env.getWeather());
        response.setAirQuality(env.getAirQuality());
        response.setTraffic(traffic);
        response.setNearbySpots(smartSpots);
        response.setBestPlace(bestPlace);

        return response;
    }

    private SmartRunningSpotDto evaluateSpot(
            RunningSpotDto raw,
            EnvironmentResponseDto env,
            TrafficInfoDto traffic,
            double userLat,
            double userLon) {

        int envScore = env.getRunningScore();
        double placeSuitability = getPlaceTypeBase(raw.getType());

        // Traffic influence: Parks and dedicated tracks are shielded from vehicle traffic
        boolean isProtectedVenue = raw.getType() != null && (raw.getType().toLowerCase().contains("track") || raw.getType().toLowerCase().contains("park"));
        double spotTrafficScore = isProtectedVenue ? 98.0 : (traffic != null && traffic.isAvailable() ? traffic.getCongestionScore() : 80.0);

        // Distance score (0km = 100, 5km = 0)
        double distanceScore = Math.max(0.0, 100.0 - (raw.getDistanceKm() * 20.0));

        // Deterministic Composite Formula:
        // finalSuitability = (envScore * 0.50) + (placeSuitability * 0.25) + (spotTrafficScore * 0.15) + (distanceScore * 0.10)
        double compositeScore = (envScore * 0.50) + (placeSuitability * 0.25) + (spotTrafficScore * 0.15) + (distanceScore * 0.10);

        // Severe Pollution Cap
        if ("AVOID".equalsIgnoreCase(env.getCondition())) {
            compositeScore = Math.min(compositeScore, 35.0);
        }

        double finalScore = Math.round(Math.max(0.0, Math.min(100.0, compositeScore)) * 10.0) / 10.0;

        String tier;
        if (finalScore >= 75.0) {
            tier = "RECOMMENDED";
        } else if (finalScore >= 50.0) {
            tier = "MODERATE";
        } else {
            tier = "AVOID";
        }

        String routeUrl = String.format(
                Locale.US,
                "https://www.google.com/maps/dir/?api=1&origin=%.6f,%.6f&destination=%.6f,%.6f&travelmode=walking",
                userLat, userLon, raw.getLatitude(), raw.getLongitude()
        );

        SmartRunningSpotDto spot = new SmartRunningSpotDto(
                raw.getName(),
                raw.getLatitude(),
                raw.getLongitude(),
                raw.getDistanceKm(),
                raw.getType(),
                raw.getOsmId(),
                finalScore,
                tier,
                raw.getMapsUrl(),
                routeUrl
        );

        // Traffic Info for spot
        TrafficInfoDto spotTraffic = new TrafficInfoDto(
                isProtectedVenue ? "LOW" : (traffic != null ? traffic.getCongestionLevel() : "UNAVAILABLE"),
                (int) Math.round(spotTrafficScore),
                isProtectedVenue ? "Protected pedestrian running zone (no vehicle traffic)" : (traffic != null ? traffic.getDescription() : "Traffic data unavailable"),
                isProtectedVenue ? "Pedestrian Green Zone" : (traffic != null ? traffic.getProvider() : "None"),
                isProtectedVenue || (traffic != null && traffic.isAvailable())
        );
        spot.setTrafficInfo(spotTraffic);

        // Positive Highlights
        List<String> highlights = new ArrayList<>();
        if (isProtectedVenue) {
            highlights.add("Zero vehicle traffic inside protected zone");
        } else if (spotTraffic.getCongestionScore() >= 80) {
            highlights.add("Low surrounding vehicle traffic");
        }

        if (env.getAirQuality() != null && env.getAirQuality().getAqi() != null && env.getAirQuality().getAqi() <= 40) {
            highlights.add(String.format(Locale.US, "Good air quality (AQI %.0f)", env.getAirQuality().getAqi()));
        }

        if (env.getWeather() != null && env.getWeather().getTemperatureC() != null) {
            double temp = env.getWeather().getTemperatureC();
            if (temp >= 15.0 && temp <= 24.0) {
                highlights.add(String.format(Locale.US, "Comfortable %.0f°C running temperature", temp));
            }
        }

        if (raw.getDistanceKm() <= 2.0) {
            highlights.add(String.format(Locale.US, "Only %.2f km from your location", raw.getDistanceKm()));
        }

        if (highlights.isEmpty()) {
            highlights.add("Standard outdoor running path");
        }
        spot.setHighlights(highlights);

        // Cautions
        List<String> cautions = new ArrayList<>();
        if (env.getAirQuality() != null && env.getAirQuality().getAqi() != null && env.getAirQuality().getAqi() > 100) {
            cautions.add("Elevated air pollution (sensitive runners should limit exertion)");
        }
        if (env.getWeather() != null && env.getWeather().getPrecipitationMm() != null && env.getWeather().getPrecipitationMm() > 0.5) {
            cautions.add("Wet ground / rain reported");
        }
        if (env.getWeather() != null && env.getWeather().getWindSpeedKmh() != null && env.getWeather().getWindSpeedKmh() > 35) {
            cautions.add("High wind gusts");
        }
        if (!isProtectedVenue && traffic != null && "HEAVY".equalsIgnoreCase(traffic.getCongestionLevel())) {
            cautions.add("Heavy vehicle congestion near perimeter roads");
        }
        spot.setCautions(cautions);

        return spot;
    }

    private double getPlaceTypeBase(String type) {
        if (type == null) return 70.0;
        String lower = type.toLowerCase();
        if (lower.contains("track")) return 95.0;
        if (lower.contains("park")) return 90.0;
        if (lower.contains("station") || lower.contains("trail")) return 85.0;
        if (lower.contains("sports") || lower.contains("pitch")) return 75.0;
        return 70.0;
    }
}
