package com.stridemate.api.environment.service;

import com.stridemate.api.environment.dto.AirQualityDto;
import com.stridemate.api.environment.dto.WeatherDto;
import org.springframework.stereotype.Component;

/**
 * Deterministic Server-Side Environmental Scoring Engine for Outdoor Fitness.
 * 
 * Scores outdoor conditions on a 0-100 scale:
 * 85 - 100 : EXCELLENT (Ideal air quality, pleasant temperature, mild wind)
 * 70 - 84  : GOOD (Safe and comfortable for outdoor workouts)
 * 50 - 69  : MODERATE (Acceptable, sensitive individuals should monitor exertion)
 * 30 - 49  : POOR (High pollutants, high heat, or heavy precipitation)
 * 0 - 29   : AVOID (Dangerous conditions: severe smog/AQI, severe storm, extreme heat)
 * 
 * CRITICAL SAFETY RULE:
 * Severe air pollution (AQI > 150, PM2.5 > 55, PM10 > 150) overrides all positive weather factors.
 */
@Component
public class EnvironmentScoringEngine {

    public static class EvaluationResult {
        private final int score;
        private final String condition;
        private final String recommendation;

        public EvaluationResult(int score, String condition, String recommendation) {
            this.score = score;
            this.condition = condition;
            this.recommendation = recommendation;
        }

        public int getScore() { return score; }
        public String getCondition() { return condition; }
        public String getRecommendation() { return recommendation; }
    }

    public EvaluationResult evaluate(WeatherDto weather, AirQualityDto airQuality, Double uvIndex) {
        double totalScore = 100.0;
        StringBuilder notices = new StringBuilder();

        // 1. Air Quality Penalties (Weight: 45% of total experience)
        boolean severePollution = false;
        boolean moderatePollution = false;

        if (airQuality != null) {
            Double aqi = airQuality.getAqi();
            Double pm25 = airQuality.getPm25();
            Double pm10 = airQuality.getPm10();

            // Severe pollution check
            if ((aqi != null && aqi > 200) || (pm25 != null && pm25 > 150.0) || (pm10 != null && pm10 > 250.0)) {
                severePollution = true;
                totalScore = Math.min(totalScore, 15.0);
                notices.append("Hazardous air quality. ");
            } else if ((aqi != null && aqi > 150) || (pm25 != null && pm25 > 55.0) || (pm10 != null && pm10 > 150.0)) {
                severePollution = true;
                totalScore = Math.min(totalScore, 35.0);
                notices.append("Unhealthy air quality (high PM2.5/AQI). ");
            } else if ((aqi != null && aqi > 100) || (pm25 != null && pm25 > 35.0) || (pm10 != null && pm10 > 100.0)) {
                moderatePollution = true;
                totalScore -= 30.0;
                notices.append("Moderate air pollution. Sensitive groups should reduce prolonged exertion. ");
            } else if ((aqi != null && aqi > 50) || (pm25 != null && pm25 > 15.0)) {
                totalScore -= 10.0;
            }
        }

        // 2. Temperature Penalties (Weight: 25%)
        if (weather != null && weather.getTemperatureC() != null) {
            double temp = weather.getTemperatureC();
            if (temp >= 15.0 && temp <= 22.0) {
                // Ideal running temperature (no penalty)
            } else if (temp >= 10.0 && temp < 15.0) {
                totalScore -= 5.0; // Cool
            } else if (temp > 22.0 && temp <= 28.0) {
                totalScore -= 10.0; // Warm
            } else if (temp > 28.0 && temp <= 35.0) {
                totalScore -= 30.0; // Hot - stay hydrated
                notices.append("High ambient temperature; stay hydrated. ");
            } else if (temp > 35.0) {
                totalScore -= 50.0; // Extreme heat
                notices.append("Extreme heat warning. Risk of heat exhaustion. ");
            } else if (temp >= 0.0 && temp < 10.0) {
                totalScore -= 15.0; // Chilly
            } else if (temp < 0.0) {
                totalScore -= 40.0; // Freezing
                notices.append("Sub-zero freezing temperature. Wear thermal layers. ");
            }
        }

        // 3. Precipitation & Weather Condition (Weight: 15%)
        if (weather != null) {
            Double precip = weather.getPrecipitationMm();
            if (precip != null && precip > 0.0) {
                if (precip > 5.0) {
                    totalScore -= 35.0;
                    notices.append("Heavy rain / wet ground conditions. ");
                } else if (precip > 1.0) {
                    totalScore -= 20.0;
                    notices.append("Light rain / drizzle. ");
                } else {
                    totalScore -= 5.0;
                }
            }

            Double wind = weather.getWindSpeedKmh();
            if (wind != null) {
                if (wind > 45.0) {
                    totalScore -= 30.0;
                    notices.append("Gale force wind gusts. ");
                } else if (wind > 25.0) {
                    totalScore -= 10.0;
                }
            }
        }

        // 4. UV Index Penalties (Weight: 15%)
        if (uvIndex != null) {
            if (uvIndex >= 10.0) {
                totalScore -= 25.0;
                notices.append("Very high UV index. Wear sun protection. ");
            } else if (uvIndex >= 7.0) {
                totalScore -= 15.0;
                notices.append("High UV. Sun protection recommended. ");
            } else if (uvIndex >= 4.0) {
                totalScore -= 5.0;
            }
        }

        // Severe Pollution Absolute Override
        if (severePollution) {
            totalScore = Math.min(totalScore, 35.0);
        }

        int finalScore = (int) Math.round(Math.max(0.0, Math.min(100.0, totalScore)));

        String condition;
        String recommendation;

        if (finalScore >= 85) {
            condition = "EXCELLENT";
            recommendation = notices.length() > 0 
                    ? notices.toString().trim() 
                    : "Air quality is pristine and temperatures are ideal for outdoor running.";
        } else if (finalScore >= 70) {
            condition = "GOOD";
            recommendation = notices.length() > 0 
                    ? notices.toString().trim() 
                    : "Great conditions for an outdoor workout. Enjoy your session!";
        } else if (finalScore >= 50) {
            condition = "MODERATE";
            recommendation = notices.length() > 0 
                    ? notices.toString().trim() 
                    : "Moderate outdoor conditions. Hydrate properly and listen to your body.";
        } else if (finalScore >= 30) {
            condition = "POOR";
            recommendation = notices.length() > 0 
                    ? notices.toString().trim() 
                    : "Suboptimal outdoor conditions. Consider indoor treadmill training or shorter workouts.";
        } else {
            condition = "AVOID";
            recommendation = notices.length() > 0 
                    ? "OUTDOOR EXERCISE NOT RECOMMENDED: " + notices.toString().trim()
                    : "Hazardous outdoor conditions. Please exercise indoors today.";
        }

        return new EvaluationResult(finalScore, condition, recommendation);
    }
}
