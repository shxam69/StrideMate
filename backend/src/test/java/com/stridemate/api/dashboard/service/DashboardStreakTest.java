package com.stridemate.api.dashboard.service;

import com.stridemate.api.dashboard.dto.DashboardStreakDto;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DashboardStreakTest {

    @Test
    void testNoActivity() {
        DashboardStreakDto result = StreakCalculator.calculate(Collections.emptyList());
        assertEquals(0, result.getCurrentStreak());
        assertEquals(0, result.getLongestStreak());
        assertFalse(result.isActiveToday());
        assertNull(result.getLastActivityDate());
    }

    @Test
    void testOneActiveDayToday() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant instant = today.atStartOfDay().toInstant(ZoneOffset.UTC);
        DashboardStreakDto result = StreakCalculator.calculate(List.of(instant));

        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getLongestStreak());
        assertTrue(result.isActiveToday());
        assertEquals(today.toString(), result.getLastActivityDate());
    }

    @Test
    void testMultipleActivitiesSameDay() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant instant1 = today.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant instant2 = today.atTime(12, 0).toInstant(ZoneOffset.UTC);
        Instant instant3 = today.atTime(23, 59).toInstant(ZoneOffset.UTC);
        DashboardStreakDto result = StreakCalculator.calculate(Arrays.asList(instant1, instant2, instant3));

        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getLongestStreak());
        assertTrue(result.isActiveToday());
    }

    @Test
    void testThreeConsecutiveDays() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Instant> instants = Arrays.asList(
                today.atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(1).atTime(12, 0).toInstant(ZoneOffset.UTC),
                today.minusDays(2).atTime(18, 0).toInstant(ZoneOffset.UTC)
        );
        DashboardStreakDto result = StreakCalculator.calculate(instants);

        assertEquals(3, result.getCurrentStreak());
        assertEquals(3, result.getLongestStreak());
        assertTrue(result.isActiveToday());
    }

    @Test
    void testMissingDayBreaksStreak() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Instant> instants = Arrays.asList(
                today.atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(1).atTime(12, 0).toInstant(ZoneOffset.UTC),
                // missing day 2
                today.minusDays(3).atTime(18, 0).toInstant(ZoneOffset.UTC),
                today.minusDays(4).atTime(18, 0).toInstant(ZoneOffset.UTC)
        );
        DashboardStreakDto result = StreakCalculator.calculate(instants);

        assertEquals(2, result.getCurrentStreak()); // today and yesterday
        assertEquals(2, result.getLongestStreak()); // tie
        assertTrue(result.isActiveToday());
    }

    @Test
    void testLongestHistoricalStreak() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Instant> instants = Arrays.asList(
                today.atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(1).atTime(12, 0).toInstant(ZoneOffset.UTC),
                // 2 day current streak
                // huge historical streak: 10, 11, 12, 13, 14 days ago (5 days)
                today.minusDays(10).atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(11).atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(12).atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(13).atStartOfDay().toInstant(ZoneOffset.UTC),
                today.minusDays(14).atStartOfDay().toInstant(ZoneOffset.UTC)
        );
        DashboardStreakDto result = StreakCalculator.calculate(instants);

        assertEquals(2, result.getCurrentStreak());
        assertEquals(5, result.getLongestStreak());
        assertTrue(result.isActiveToday());
    }

    @Test
    void testActivityAroundUTCMidnight() {
        // UTC midnight is the boundary.
        // E.g., 2026-08-10 23:59:00 UTC and 2026-08-11 00:01:00 UTC are different days
        LocalDate date = LocalDate.of(2026, 8, 10);
        Instant i1 = date.atTime(23, 59).toInstant(ZoneOffset.UTC);
        Instant i2 = date.plusDays(1).atTime(0, 1).toInstant(ZoneOffset.UTC);

        DashboardStreakDto result = StreakCalculator.calculate(Arrays.asList(i1, i2));

        // It should see them as consecutive 2 days, assuming today is not evaluated (or it is in the past, streak ends at i2)
        // Wait, currentStreak evaluates based on today. If today is much later, currentStreak = 0.
        // Longest streak should be 2.
        assertEquals(2, result.getLongestStreak());
        assertFalse(result.isActiveToday()); // unless today is 2026-08-11
    }
}
