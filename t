[1mdiff --git a/backend/src/main/java/com/stridemate/api/auth/service/OtpService.java b/backend/src/main/java/com/stridemate/api/auth/service/OtpService.java[m
[1mindex c8b583f..ead1f86 100644[m
[1m--- a/backend/src/main/java/com/stridemate/api/auth/service/OtpService.java[m
[1m+++ b/backend/src/main/java/com/stridemate/api/auth/service/OtpService.java[m
[36m@@ -12,10 +12,14 @@[m [mimport java.security.SecureRandom;[m
 import java.time.Instant;[m
 import java.time.temporal.ChronoUnit;[m
 import java.util.Optional;[m
[32m+[m[32mimport org.slf4j.Logger;[m
[32m+[m[32mimport org.slf4j.LoggerFactory;[m
 [m
 @Service[m
 public class OtpService {[m
 [m
[32m+[m[32m    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);[m
[32m+[m
     private final OtpRepository otpRepository;[m
     private final UserRepository userRepository;[m
     private final PasswordEncoder passwordEncoder;[m
[36m@@ -41,6 +45,7 @@[m [mpublic class OtpService {[m
         // Generate a 6-digit OTP[m
         int otpValue = 100000 + secureRandom.nextInt(900000); // 100000 to 999999[m
         String otpStr = String.valueOf(otpValue);[m
[32m+[m[32m        logger.info("Generated new OTP for user {}", email);[m
 [m
         // Store OTP hash[m
         OtpEntity otpEntity = new OtpEntity();[m
[36m@@ -49,9 +54,17 @@[m [mpublic class OtpService {[m
         otpEntity.setExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));[m
         otpEntity.setAttempts(0);[m
         otpRepository.save(otpEntity);[m
[32m+[m[32m        logger.info("Persisted OTP hash for user {}", email);[m
 [m
         // Send via SMTP[m
[31m-        emailService.sendOtpEmail(email, otpStr);[m
[32m+[m[32m        try {[m
[32m+[m[32m            logger.info("Starting email-send for user {}", email);[m
[32m+[m[32m            emailService.sendOtpEmail(email, otpStr);[m
[32m+[m[32m            logger.info("Completed email-send successfully for user {}", email);[m
[32m+[m[32m        } catch (Exception e) {[m
[32m+[m[32m            logger.error("Failed email-send for user {}: {}", email, e.getMessage());[m
[32m+[m[32m            throw new RuntimeException("Failed to send OTP email. Please try again later.");[m
[32m+[m[32m        }[m
     }[m
 [m
     public boolean verifyOtp(String email, String otpCode) {[m
[1mdiff --git a/backend/src/main/resources/application-prod.properties b/backend/src/main/resources/application-prod.properties[m
[1mindex b3648d1..10badae 100644[m
[1m--- a/backend/src/main/resources/application-prod.properties[m
[1m+++ b/backend/src/main/resources/application-prod.properties[m
[36m@@ -13,6 +13,9 @@[m [mspring.mail.username=${MAIL_USERNAME:}[m
 spring.mail.password=${MAIL_PASSWORD:}[m
 spring.mail.properties.mail.smtp.auth=${MAIL_SMTP_AUTH:true}[m
 spring.mail.properties.mail.smtp.starttls.enable=${MAIL_STARTTLS_ENABLE:true}[m
[32m+[m[32mspring.mail.properties.mail.smtp.connectiontimeout=5000[m
[32m+[m[32mspring.mail.properties.mail.smtp.timeout=5000[m
[32m+[m[32mspring.mail.properties.mail.smtp.writetimeout=5000[m
 mail.from=${MAIL_FROM:noreply@stridemate.app}[m
 [m
 jwt.secret=${JWT_SECRET}[m
[1mdiff --git a/backend/src/main/resources/application.properties b/backend/src/main/resources/application.properties[m
[1mindex 527f4f2..4024660 100644[m
[1m--- a/backend/src/main/resources/application.properties[m
[1m+++ b/backend/src/main/resources/application.properties[m
[36m@@ -31,4 +31,7 @@[m [mspring.mail.username=${MAIL_USERNAME:}[m
 spring.mail.password=${MAIL_PASSWORD:}[m
 spring.mail.properties.mail.smtp.auth=${MAIL_SMTP_AUTH:true}[m
 spring.mail.properties.mail.smtp.starttls.enable=${MAIL_STARTTLS_ENABLE:true}[m
[32m+[m[32mspring.mail.properties.mail.smtp.connectiontimeout=5000[m
[32m+[m[32mspring.mail.properties.mail.smtp.timeout=5000[m
[32m+[m[32mspring.mail.properties.mail.smtp.writetimeout=5000[m
 mail.from=${MAIL_FROM:noreply@stridemate.local}[m
