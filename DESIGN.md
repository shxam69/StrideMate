# StrideMate Design Document

## A. System Architecture & Data Flow
StrideMate is a full-stack fitness tracking web application built using a strictly layered architecture.
- **Frontend**: A Single Page Application (SPA) built with Vite, React, TypeScript, and Tailwind CSS. It communicates entirely via REST APIs.
- **Backend**: A Java Spring Boot application implementing RESTful APIs. It adheres to a strictly layered design (Controllers -> Services -> Repositories -> Entities) to separate transport, business logic, and data access.
- **Database**: H2 in-memory relational database configured with JPA/Hibernate for auto-DDL and ORM.

**Registration Request Flow**:
1. Client POSTs JSON payload to `/api/auth/register`.
2. `AuthController` passes payload to `AuthService`.
3. `AuthService` checks for duplicate firstName/lastName combination. If duplicate, throws `DuplicateResourceException` (HTTP 409).
4. If valid, hashes password using BCrypt, generates UUID, saves to `users` table via `UserRepository`.
5. Returns a generated UUID `userId` and a JWT token.

**Activity Ingestion Flow**:
1. Client POSTs JSON payload with valid `SportType` and corresponding metric (e.g., distance or duration) to `/api/activities`.
2. `ActivityController` enforces `@Valid` annotations (rejecting negative numbers).
3. `ActivityService` validates that the sport exactly matches the supplied metric type, rejecting mismatches (HTTP 400).
4. `ScoringService` calculates floored points based on strict rules.
5. Entity is persisted to the `activities` table via `ActivityRepository`.

## B. Database Schema & Data Model
The database is fully relational using H2 and Spring Data JPA.
- **`users` table**:
  - `id` (UUID, primary key)
  - `email` (VARCHAR, unique constraint)
  - `first_name` (VARCHAR)
  - `last_name` (VARCHAR)
  - `password_hash` (VARCHAR)
  - **Duplicate Enforcement**: The application explicitly queries `UserRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase()` before insertion to enforce the assignment requirement of rejecting duplicate full names.
- **`activities` table**:
  - `id` (UUID, primary key)
  - `user_id` (UUID, Foreign Key -> `users.id`)
  - `sport` (VARCHAR, enum: RUNNING, WALKING, CYCLING, SWIMMING, GYM, DAILY_STEPS)
  - `distance_km` (NUMERIC)
  - `duration_minutes` (INTEGER)
  - `duration_seconds` (INTEGER)
  - `steps` (INTEGER)
  - `points` (INTEGER, calculated source-of-truth)

**Leaderboard Representation**:
The leaderboard ranking is dynamically generated using SQL aggregations (`SUM(points) GROUP BY user_id`) via JPA `@Query` rather than keeping a duplicated leaderboard table, guaranteeing real-time accuracy and preventing consistency anomalies.

## C. API Specifications

**1. Registration Endpoint**
- **Route**: `POST /api/auth/register`
- **Request Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password1!",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response Payload**: `201 Created` with `userId` and `token`.
- **Validation Rules**: `email` must be valid format, `password` must be strong, `firstName` and `lastName` cannot be null or duplicate combinations.
- **Error Handling**: `400 Bad Request` for invalid format. `409 Conflict` for duplicate name or email.

**2. Activity Ingestion Endpoint**
- **Route**: `POST /api/activities`
- **Request Payload**:
  ```json
  {
    "sport": "RUNNING",
    "distanceKm": 1.25
  }
  ```
- **Response Payload**: `201 Created` with full activity details including calculated `points`.
- **Validation Rules**: `sport` is strictly mapped to its required metric. Negative numbers are rejected (`@PositiveOrZero`).
- **Error Handling**: `400 Bad Request` for any mismatched metrics, missing metrics, or negative values.

## D. Scoring & Normalization Logic
The `ScoringService` calculates points based strictly on the assignment constraints. The final points are written natively to the `Activity` entity.

**Exact Multipliers**:
- **Running**: 100 points per km
- **Walking**: 50 points per km
- **Cycling**: 25 points per km
- **Swimming**: 15 points per minute
- **Gym**: 5 points per minute
- **Daily Steps**: 1 point per 100 steps

**Flooring Behavior**:
- **Distance**: 
  `floor(distance × rate)`
  Points are calculated by multiplying distance and the rate FIRST, and then the final resulting points are floored to the nearest integer. (e.g., 1.55km Walking = 1.55 * 50 = 77.5 floored to 77 points).
- **Duration**: 
  `floor(totalSeconds / 60) × rate`
  Total elapsed seconds are floored to the nearest whole minute BEFORE calculating points. (e.g., 1 minute 59 seconds = 119 seconds. 119/60 floored = 1 minute * 15 = 15 points).
- **Steps**: 
  `floor(steps / 100)` (Since rate is 1)
  The raw step count is floored to the nearest block of 100 BEFORE calculating points. (e.g., 399 steps / 100 floored = 3 blocks * 1 = 3 points).

## E. Frontend Architecture & Visualizations
The frontend is a strictly typed React application utilizing modern hooks and functional components.
- **Dashboard Components**:
  - Displays total accumulated points fetched via pre-aggregated backend API.
  - Displays activity history in a chronological list.
  - Displays activity volume/trend over time using `recharts` for visual graphs.
  - Displays sport preference breakdown in a pie chart.
- **Leaderboard Components**:
  - Renders the globally ranked list of users by total points.
  - Displays visual ranking trends (up/down/flat) compared to 24-hour historical bounds.
- **Activity Entry (AddActivity.tsx)**:
  - Dynamically renders metric input fields (distance, duration, or steps) based strictly on which of the 6 sports is selected, ensuring the user cannot submit invalid payloads.

## F. Trade-offs & Edge Cases
- **Duplicate Registration**: Handled gracefully. We issue a DB read to check the `firstName` + `lastName` combination. A `409 Conflict` prevents insertion.
- **Invalid Metrics & Negative Values**: Instead of silently ignoring bad payloads, the backend aggressively rejects invalid combinations (e.g., Distance supplied for Swimming, or negative duration) with `400 Bad Request`.
- **Fractional Distance / Partial Minutes / Partial Steps**: Addressed inherently by the `ScoringService` math using `BigDecimal` floor and integer division to safely clip fractional value.
- **Concurrent Activity Submissions**: Instead of keeping a running `totalPoints` counter on the `User` entity (which would be subject to race conditions and dirty reads during concurrent inserts), we dynamically aggregate points at read-time via `SUM(points)`.
- **Invalid Users / Authentication**: Unauthenticated users trying to submit activities receive a `401 Unauthorized` directly via the `JwtAuthenticationFilter`, ensuring unauthenticated payloads never reach the business logic.
- **In-Memory Database**: For the assignment scope, H2 is utilized for simplicity of execution without Docker dependencies. In a true production environment, PostgreSQL would handle large scale aggregation better.
