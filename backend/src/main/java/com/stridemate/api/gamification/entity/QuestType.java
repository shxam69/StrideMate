package com.stridemate.api.gamification.entity;

public enum QuestType {
    MOVE_TIME,          // Duration in minutes (e.g. Move for 20 mins)
    DISTANCE,           // Distance in meters (e.g. 2000m = 2.0 km)
    COMPLETE_ACTIVITY,  // Count of activities (e.g. 1 activity)
    EARN_POINTS         // Points earned in a day (e.g. 50 points)
}
