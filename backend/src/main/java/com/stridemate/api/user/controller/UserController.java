package com.stridemate.api.user.controller;

import com.stridemate.api.user.dto.UpdateProfileRequest;
import com.stridemate.api.user.dto.UserDto;
import com.stridemate.api.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUserProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUserProfile(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<UserDto> uploadAvatar(@RequestParam("file") MultipartFile file, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.uploadAvatar(email, file));
    }

    @GetMapping("/avatar/{filename:.+}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String filename) {
        Resource file = userService.loadAvatar(filename);

        String contentType = "image/jpeg";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) {
            contentType = "image/png";
        } else if (lower.endsWith(".webp")) {
            contentType = "image/webp";
        } else if (lower.endsWith(".svg")) {
            contentType = "image/svg+xml";
        } else {
            try {
                String probeType = Files.probeContentType(Paths.get(file.getURI()));
                if (probeType != null) {
                    contentType = probeType;
                }
            } catch (IOException ignored) {}
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400, must-revalidate")
                .contentType(MediaType.parseMediaType(contentType))
                .body(file);
    }
}
