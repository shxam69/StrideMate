package com.stridemate.api.environment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.environment.dto.AirQualityDto;
import com.stridemate.api.environment.dto.WeatherDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Locale;

@Service
public class OpenMeteoClient {

    private static final Logger log = LoggerFactory.getLogger(OpenMeteoClient.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenMeteoClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(4000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    public WeatherDto fetchCurrentWeather(double latitude, double longitude) {
        String url = String.format(
                Locale.US,
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index",
                latitude,
                longitude
        );

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode current = root.path("current");

                WeatherDto dto = new WeatherDto();
                if (current.hasNonNull("temperature_2m")) dto.setTemperatureC(current.get("temperature_2m").asDouble());
                if (current.hasNonNull("apparent_temperature")) dto.setFeelsLikeC(current.get("apparent_temperature").asDouble());
                if (current.hasNonNull("relative_humidity_2m")) dto.setHumidityPercent(current.get("relative_humidity_2m").asDouble());
                if (current.hasNonNull("wind_speed_10m")) dto.setWindSpeedKmh(current.get("wind_speed_10m").asDouble());
                if (current.hasNonNull("precipitation")) dto.setPrecipitationMm(current.get("precipitation").asDouble());
                if (current.hasNonNull("weather_code")) dto.setWeatherCode(current.get("weather_code").asInt());

                return dto;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch weather from Open-Meteo for lat={}, lon={}: {}", latitude, longitude, e.getMessage());
        }

        // Fallback default
        return new WeatherDto(20.0, 20.0, 50.0, 10.0, 0.0, 0);
    }

    public AirQualityDto fetchCurrentAirQuality(double latitude, double longitude) {
        String url = String.format(
                Locale.US,
                "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%.4f&longitude=%.4f&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust",
                latitude,
                longitude
        );

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode current = root.path("current");

                AirQualityDto dto = new AirQualityDto();
                if (current.hasNonNull("european_aqi")) dto.setAqi(current.get("european_aqi").asDouble());
                if (current.hasNonNull("pm2_5")) dto.setPm25(current.get("pm2_5").asDouble());
                if (current.hasNonNull("pm10")) dto.setPm10(current.get("pm10").asDouble());
                if (current.hasNonNull("dust")) dto.setDust(current.get("dust").asDouble());
                if (current.hasNonNull("ozone")) dto.setOzone(current.get("ozone").asDouble());
                if (current.hasNonNull("nitrogen_dioxide")) dto.setNitrogenDioxide(current.get("nitrogen_dioxide").asDouble());
                if (current.hasNonNull("sulphur_dioxide")) dto.setSulphurDioxide(current.get("sulphur_dioxide").asDouble());
                if (current.hasNonNull("carbon_monoxide")) dto.setCarbonMonoxide(current.get("carbon_monoxide").asDouble());

                return dto;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch air quality from Open-Meteo for lat={}, lon={}: {}", latitude, longitude, e.getMessage());
        }

        // Fallback default
        return new AirQualityDto(25.0, 10.0, 20.0, 5.0, 30.0, 15.0, 5.0, 200.0);
    }

    public Double fetchUvIndex(double latitude, double longitude) {
        String url = String.format(
                Locale.US,
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=uv_index",
                latitude,
                longitude
        );

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode current = root.path("current");
                if (current.hasNonNull("uv_index")) {
                    return current.get("uv_index").asDouble();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch UV index from Open-Meteo for lat={}, lon={}: {}", latitude, longitude, e.getMessage());
        }

        return 3.0; // Moderate default UV
    }
}
