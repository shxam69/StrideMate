package com.stridemate.api.gamification.entity;

public enum AchievementCode {
    FIRST_ACTIVITY("First Steps", "Log your first fitness activity in StrideMate", "Footprints", 50, "Complete 1 activity"),
    FIRST_100_XP("Century Mover", "Earn your first 100 XP from training", "Zap", 100, "Earn 100 Total XP"),
    THREE_DAY_STREAK("Consistency Starter", "Maintain an active streak for 3 consecutive days", "Flame", 150, "Reach 3-Day Streak"),
    SEVEN_DAY_STREAK("Weekly Champion", "Maintain an active streak for 7 consecutive days", "Flame", 300, "Reach 7-Day Streak"),
    TEN_KM_TOTAL("Distance Pioneer", "Accumulate 10 total kilometers across outdoor activities", "MapPin", 200, "Cover 10 km total distance"),
    ONE_THOUSAND_XP("Stride Master", "Reach a grand total of 1,000 XP in StrideMate", "Trophy", 500, "Reach 1,000 Total XP"),
    THIRTY_DAY_STREAK("Iron Will", "Maintain an active streak for 30 consecutive days", "Crown", 1000, "Reach 30-Day Streak"),
    TEN_KM_RUNNING("Speed Demon", "Accumulate 10 kilometers of dedicated running distance", "Flame", 350, "Cover 10 km running distance");

    private final String name;
    private final String description;
    private final String icon;
    private final int rewardXp;
    private final String requirementDescription;

    AchievementCode(String name, String description, String icon, int rewardXp, String requirementDescription) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.rewardXp = rewardXp;
        this.requirementDescription = requirementDescription;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getIcon() {
        return icon;
    }

    public int getRewardXp() {
        return rewardXp;
    }

    public String getRequirementDescription() {
        return requirementDescription;
    }
}
