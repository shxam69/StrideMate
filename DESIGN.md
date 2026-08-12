# StrideMate Design Document

## 1. System Architecture
StrideMate is a full-stack fitness tracking web application built using a layered architecture:
- **Frontend**: A Single Page Application (SPA) built with Vite, React, TypeScript, and Tailwind CSS. It communicates entirely via REST APIs.
- **Backend**: A Java Spring Boot application implementing RESTful APIs. It adheres to a strictly layered design (Controllers -> Services -> Repositories -> Entities) to separate transport, business logic, and data access.
- **Database**: H2 in-memory relational database configured with JPA/Hibernate for auto-DDL and ORM.

## 2. Request/Data Flow
1. The Frontend (React) makes Axios HTTP requests to the Backend (`http://localhost:8080/api`).
2. Spring Security intercepts the request; if it requires authentication, the `JwtAuthenticationFilter` validates the `Authorization: Bearer <token>` header.
3. The `Controller` receives the request payload (mapped to a DTO) and passes it to the `Service`.
4. The `Service` executes business logic, invokes `ScoringService` for calculations, and interacts with the `Repository`.
5. The `Repository` translates method calls or custom `@Query` annotations into SQL and executes them against the H2 Database.
6. Data is returned back up the chain and formatted into a Response DTO, sent as JSON to the frontend.

## 3. Database Schema
- **`users` table**: Stores `id` (UUID, primary key), `email` (unique constraint), `first_name`, `last_name`, `password_hash`, `role`, and timestamps.
- **`activities` table**: Stores `id` (UUID, primary key), `user_id` (Foreign Key -> users.id), `sport` (VARCHAR enum), metrics (`distance_km`, `duration_minutes`, `duration_seconds`, `steps`), `points` (calculated integer), and timestamps.

## 4. Authentication Flow
Authentication is stateless and uses JSON Web Tokens (JWT).
- **Registration/Login**: The user posts credentials to `/api/auth/login`. Passwords are encrypted using BCrypt. On success, a 15-minute JWT is signed and returned.
- **Frontend Storage**: The frontend stores the JWT in `localStorage`. 
- **Trade-off**: `localStorage` is used for simplicity in this milestone. In a real-world production environment, HttpOnly secure cookies are preferred to mitigate XSS (Cross-Site Scripting) token theft.

## 5. Activity Model & Scoring Normalization
Activities must have a valid `SportType` and strict matching metrics (e.g., Running requires distance, Swimming requires duration).
- **Scoring Normalization**: The `ScoringService` is an independent, pure business-logic class. It calculates points based on exact math:
  - Distance sports are multiplied by their rate using `BigDecimal` and floored strictly using `RoundingMode.FLOOR` to prevent floating-point rounding errors.
  - Duration sports count only fully completed minutes (integer division).
  - Daily steps count only fully completed 100-step blocks.
- **Source of Truth**: The calculated `points` are stored directly on the `Activity` record.

## 6. API Specifications
- `POST /api/auth/register`: Creates a user and returns a token.
- `POST /api/auth/login`: Authenticates a user and returns a token.
- `GET /api/auth/me`: Validates the token and returns user details.
- `POST /api/activities`: Submits an activity, validating strict metric combinations, calculates points, and persists.
- `GET /api/dashboard/me`: Returns a single aggregated payload (points, rank, activity history, volume over time, sport breakdown).
- `GET /api/leaderboard`: Returns a globally ranked list of users by total points.

## 7. Leaderboard Calculation & Ranking Strategy
- **Calculation**: The global leaderboard is generated dynamically via a JPA `@Query` aggregation that performs `SUM(a.points)` grouped by user. This completely avoids keeping a duplicated, potentially out-of-sync leaderboard table.
- **Ranking strategy**: Ordered by `SUM(points) DESC`, with ties broken deterministically using `user.id ASC`.
- **Derived Trend Strategy**: The assignment requests ranking trends (UP, DOWN, FLAT). To prevent complex event sourcing or cron-based scheduled snapshots, the system dynamically calculates a "simulated historical rank" by excluding activities recorded in the last 24 hours. The current rank is compared against this derived previous rank to determine the trend. This satisfies the requirement effectively without over-engineering.

## 8. Dashboard Aggregation
To keep the frontend fast and thin, the `/api/dashboard/me` endpoint returns fully pre-aggregated data utilizing SQL `GROUP BY`.
- Total points and counts use basic `SUM()` / `COUNT()` queries.
- Global rank is determined by comparing the user's ID against the globally ordered leaderboard list.
- Volume over time uses `GROUP BY CAST(a.recordedAt AS date)` to chunk data cleanly into daily buckets.

## 9. Frontend Architecture
The React frontend uses Context API (`AuthContext`) for global state management regarding authentication. 
- Components are designed responsively using Tailwind CSS classes.
- Charts utilize `recharts` for scalable SVG-based data visualization.
- Data fetching is centralized via an Axios interceptor `api.ts` that handles attaching the JWT to every outgoing request.

## 10. Trade-offs & Edge Cases
- **Database Choice**: H2 is an in-memory database used for development. While it supports standard SQL, in a production setup, a database like PostgreSQL would provide stronger aggregation and JSON features.
- **Scaling the Leaderboard**: Currently, the leaderboard aggregates the entire `activities` table. For a massive user base (millions of users/activities), this query would become slow. A trade-off was made to calculate it dynamically to ensure 100% data consistency rather than building a cached Redis sorted-set or materialized view, which would be the production solution for a large-scale system.
- **Concurrency**: By not duplicating total points onto the `User` entity, we avoid concurrency issues (e.g., race conditions when two activities are submitted simultaneously updating a single `User.totalPoints` field). The aggregation approach guarantees accuracy regardless of concurrent inserts.
