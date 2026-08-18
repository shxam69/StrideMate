package com.stridemate.api.environment.dto;

public class AirQualityDto {
    private Double aqi;
    private Double pm25;
    private Double pm10;
    private Double dust;
    private Double ozone;
    private Double nitrogenDioxide;
    private Double sulphurDioxide;
    private Double carbonMonoxide;

    public AirQualityDto() {}

    public AirQualityDto(Double aqi, Double pm25, Double pm10, Double dust, Double ozone, Double nitrogenDioxide, Double sulphurDioxide, Double carbonMonoxide) {
        this.aqi = aqi;
        this.pm25 = pm25;
        this.pm10 = pm10;
        this.dust = dust;
        this.ozone = ozone;
        this.nitrogenDioxide = nitrogenDioxide;
        this.sulphurDioxide = sulphurDioxide;
        this.carbonMonoxide = carbonMonoxide;
    }

    public Double getAqi() { return aqi; }
    public void setAqi(Double aqi) { this.aqi = aqi; }

    public Double getPm25() { return pm25; }
    public void setPm25(Double pm25) { this.pm25 = pm25; }

    public Double getPm10() { return pm10; }
    public void setPm10(Double pm10) { this.pm10 = pm10; }

    public Double getDust() { return dust; }
    public void setDust(Double dust) { this.dust = dust; }

    public Double getOzone() { return ozone; }
    public void setOzone(Double ozone) { this.ozone = ozone; }

    public Double getNitrogenDioxide() { return nitrogenDioxide; }
    public void setNitrogenDioxide(Double nitrogenDioxide) { this.nitrogenDioxide = nitrogenDioxide; }

    public Double getSulphurDioxide() { return sulphurDioxide; }
    public void setSulphurDioxide(Double sulphurDioxide) { this.sulphurDioxide = sulphurDioxide; }

    public Double getCarbonMonoxide() { return carbonMonoxide; }
    public void setCarbonMonoxide(Double carbonMonoxide) { this.carbonMonoxide = carbonMonoxide; }
}
