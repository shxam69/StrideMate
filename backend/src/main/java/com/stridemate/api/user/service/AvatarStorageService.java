package com.stridemate.api.user.service;

import com.stridemate.api.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class AvatarStorageService {

    private static final Logger log = LoggerFactory.getLogger(AvatarStorageService.class);

    private final Path rootLocation;
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    public AvatarStorageService(@Value("${app.upload.dir:uploads/avatars}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Initialized AvatarStorageService with root directory: {}", this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + this.rootLocation, e);
        }
    }

    public String store(MultipartFile file, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5MB limit.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (ext.equals("png") || ext.equals("webp") || ext.equals("jpeg") || ext.equals("jpg")) {
                extension = ext;
            }
        }

        String filename = "avatar-" + userId + "-" + System.currentTimeMillis() + "." + extension;

        try {
            Path destinationFile = this.rootLocation.resolve(Paths.get(filename)).normalize().toAbsolutePath();
            if (!destinationFile.getParent().equals(this.rootLocation)) {
                throw new IllegalArgumentException("Cannot store file outside current directory.");
            }

            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored avatar successfully at: {}", destinationFile);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    public Resource loadAsResource(String filename) {
        try {
            Path file = rootLocation.resolve(filename).normalize().toAbsolutePath();
            if (!file.getParent().equals(this.rootLocation)) {
                throw new IllegalArgumentException("Invalid avatar filename: " + filename);
            }
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Avatar file not found: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Avatar file not found: " + filename);
        }
    }
}
