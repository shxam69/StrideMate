package com.stridemate.api.environment.dto;

public class WeatherDto {
    private Double temperatureC;
    private Double feelsLikeC;
    private Double humidityPercent;
    private Double windSpeedKmh;
    private Double precipitationMm;
    private Integer weatherCode;

    public WeatherDto() {}

    public WeatherDto(Double temperatureC, Double feelsLikeC, Double humidityPercent, Double windSpeedKmh, Double precipitationMm, Integer weatherCode) {
        this.temperatureC = temperatureC;
        this.feelsLikeC = feelsLikeC;
        this.humidityPercent = humidityPercent;
        this.windSpeedKmh = windSpeedKmh;
        this.precipitationMm = precipitationMm;
        this.weatherCode = weatherCode;
    }

    public Double getTemperatureC() { return temperatureC; }
    public void setTemperatureC(Double temperatureC) { this.temperatureC = temperatureC; }

    public Double getFeelsLikeC() { return feelsLikeC; }
    public void setFeelsLikeC(Double feelsLikeC) { this.feelsLikeC = feelsLikeC; }

    public Double getHumidityPercent() { return humidityPercent; }
    public void setHumidityPercent(Double humidityPercent) { this.humidityPercent = humidityPercent; }

    public Double getWindSpeedKmh() { return windSpeedKmh; }
    public void setWindSpeedKmh(Double windSpeedKmh) { this.windSpeedKmh = windSpeedKmh; }

    public Double getPrecipitationMm() { return precipitationMm; }
    public void setPrecipitationMm(Double precipitationMm) { this.precipitationMm = precipitationMm; }

    public Integer getWeatherCode() { return weatherCode; }
    public void setWeatherCode(Integer weatherCode) { this.weatherCode = weatherCode; }
}
