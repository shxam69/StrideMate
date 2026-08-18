package com.stridemate.api.user.controller;

import com.stridemate.api.user.dto.UpdateProfileRequest;
import com.stridemate.api.user.dto.UserDto;
import com.stridemate.api.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
}
