package com.stridemate.api.dashboard.service;

import com.stridemate.api.dashboard.dto.DashboardStreakDto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class StreakCalculator {

    public static DashboardStreakDto calculate(List<Instant> instants) {
        if (instants == null || instants.isEmpty()) {
            return new DashboardStreakDto(0, 0, false, null);
        }

        // 1. Convert to unique sorted LocalDates using UTC
        List<LocalDate> distinctDates = instants.stream()
                .map(instant -> instant.atZone(ZoneOffset.UTC).toLocalDate())
                .distinct()
                .sorted(Comparator.reverseOrder()) // Newest first
                .collect(Collectors.toList());

        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        // 2. Active today and last activity date
        boolean activeToday = distinctDates.get(0).equals(today);
        String lastActivityDate = distinctDates.get(0).toString();

        // 3. Current Streak
        int currentStreak = 0;
        LocalDate expectedDate = null;

        if (activeToday) {
            expectedDate = today;
        } else if (distinctDates.get(0).equals(today.minusDays(1))) {
            expectedDate = today.minusDays(1);
        }

        if (expectedDate != null) {
            for (LocalDate date : distinctDates) {
                if (date.equals(expectedDate)) {
                    currentStreak++;
                    expectedDate = expectedDate.minusDays(1);
                } else {
                    break;
                }
            }
        }

        // 4. Longest Streak
        int longestStreak = 0;
        int tempStreak = 0;
        LocalDate prev = null;

        // Iterate oldest to newest for easier logic
        for (int i = distinctDates.size() - 1; i >= 0; i--) {
            LocalDate date = distinctDates.get(i);
            if (prev == null) {
                tempStreak = 1;
            } else {
                if (date.equals(prev.plusDays(1))) {
                    tempStreak++;
                } else {
                    tempStreak = 1; // broken streak
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
            prev = date;
        }

        return new DashboardStreakDto(currentStreak, longestStreak, activeToday, lastActivityDate);
    }
}
