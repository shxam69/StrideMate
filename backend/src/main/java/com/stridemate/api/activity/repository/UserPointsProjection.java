package com.stridemate.api.activity.repository;

import java.util.UUID;

public interface UserPointsProjection {
    UUID getUserId();
    String getFirstName();
    String getLastName();
    Long getTotalPoints();
}
