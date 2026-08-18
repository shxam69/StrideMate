package com.stridemate.api.environment.service;

import com.stridemate.api.environment.dto.TrafficInfoDto;

public interface TrafficProvider {
    TrafficInfoDto getTrafficInfo(double latitude, double longitude);
}
