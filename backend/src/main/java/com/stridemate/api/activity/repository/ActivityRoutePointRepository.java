package com.stridemate.api.activity.repository;

import com.stridemate.api.activity.entity.ActivityRoutePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRoutePointRepository extends JpaRepository<ActivityRoutePoint, UUID> {
    List<ActivityRoutePoint> findByActivityIdOrderByRecordedAtAsc(UUID activityId);
    void deleteByActivityId(UUID activityId);
}
