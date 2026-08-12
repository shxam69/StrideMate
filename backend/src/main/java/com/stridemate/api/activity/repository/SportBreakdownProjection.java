package com.stridemate.api.activity.repository;

import com.stridemate.api.activity.entity.SportType;

public interface SportBreakdownProjection {
    SportType getSport();
    Long getActivityCount();
    Long getPoints();
}
