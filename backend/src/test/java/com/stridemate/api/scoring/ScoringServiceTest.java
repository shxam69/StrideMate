package com.stridemate.api.scoring;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.SportType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ScoringServiceTest {

    private ScoringService scoringService;

    @BeforeEach
    public void setup() {
        scoringService = new ScoringService();
    }

    private Activity createDistanceActivity(SportType sport, String distanceKm) {
        Activity activity = new Activity();
        activity.setSport(sport);
        activity.setDistanceKm(new BigDecimal(distanceKm));
        return activity;
    }

    private Activity createDurationActivity(SportType sport, int minutes, int seconds) {
        Activity activity = new Activity();
        activity.setSport(sport);
        activity.setDurationMinutes(minutes);
        activity.setDurationSeconds(seconds);
        return activity;
    }

    private Activity createStepsActivity(int steps) {
        Activity activity = new Activity();
        activity.setSport(SportType.DAILY_STEPS);
        activity.setSteps(steps);
        return activity;
    }

    @Test
    public void testRunning1Km() {
        assertEquals(100, scoringService.calculatePoints(createDistanceActivity(SportType.RUNNING, "1.0")));
    }

    @Test
    public void testRunning2_5Km() {
        assertEquals(250, scoringService.calculatePoints(createDistanceActivity(SportType.RUNNING, "2.5")));
    }

    @Test
    public void testWalking1Km() {
        assertEquals(50, scoringService.calculatePoints(createDistanceActivity(SportType.WALKING, "1.0")));
    }

    @Test
    public void testWalking1_55Km() {
        // 1.55 * 50 = 77.5 -> floored to 77
        assertEquals(77, scoringService.calculatePoints(createDistanceActivity(SportType.WALKING, "1.55")));
    }

    @Test
    public void testCycling1Km() {
        assertEquals(25, scoringService.calculatePoints(createDistanceActivity(SportType.CYCLING, "1.0")));
    }

    @Test
    public void testCyclingFractionalDistance() {
        // 1.9 km * 25 = 47.5 -> floored to 47
        assertEquals(47, scoringService.calculatePoints(createDistanceActivity(SportType.CYCLING, "1.9")));
    }

    @Test
    public void testSwimming1Minute() {
        assertEquals(15, scoringService.calculatePoints(createDurationActivity(SportType.SWIMMING, 1, 0)));
    }

    @Test
    public void testSwimming1Minute55Seconds() {
        assertEquals(15, scoringService.calculatePoints(createDurationActivity(SportType.SWIMMING, 1, 55)));
    }

    @Test
    public void testSwimming2Minutes59Seconds() {
        assertEquals(30, scoringService.calculatePoints(createDurationActivity(SportType.SWIMMING, 2, 59)));
    }

    @Test
    public void testGym1Minute() {
        assertEquals(5, scoringService.calculatePoints(createDurationActivity(SportType.GYM, 1, 0)));
    }

    @Test
    public void testGym2Minutes59Seconds() {
        assertEquals(10, scoringService.calculatePoints(createDurationActivity(SportType.GYM, 2, 59)));
    }

    @Test
    public void test100Steps() {
        assertEquals(1, scoringService.calculatePoints(createStepsActivity(100)));
    }

    @Test
    public void test399Steps() {
        assertEquals(3, scoringService.calculatePoints(createStepsActivity(399)));
    }

    @Test
    public void test999Steps() {
        assertEquals(9, scoringService.calculatePoints(createStepsActivity(999)));
    }

    @Test
    public void testInvalidNegativeValuesAreRejected() {
        // Technically scoring service treats <= 0 as 0. Validation should catch this earlier, but scoring should not give negative points.
        assertEquals(0, scoringService.calculatePoints(createDistanceActivity(SportType.RUNNING, "-1.0")));
        assertEquals(0, scoringService.calculatePoints(createDurationActivity(SportType.SWIMMING, -1, 0)));
        assertEquals(0, scoringService.calculatePoints(createStepsActivity(-100)));
    }
}
