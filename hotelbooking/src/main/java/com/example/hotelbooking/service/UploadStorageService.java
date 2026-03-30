package com.example.hotelbooking.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadStorageService {

    private final Path uploadRoot = Path.of(System.getProperty("user.dir"), "uploads");

    public String storeImage(MultipartFile file) throws IOException {
        return storeImages(List.of(file)).get(0);
    }

    public List<String> storeImages(MultipartFile[] files) throws IOException {
        return storeImages(files == null ? List.of() : Arrays.asList(files));
    }

    public List<String> storeImages(List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new RuntimeException("Files are required");
        }

        Files.createDirectories(uploadRoot);

        List<String> storedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            validateImage(file);

            String originalName = StringUtils.cleanPath(
                    Objects.toString(file.getOriginalFilename(), "image"));
            String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safeName.isBlank()) {
                safeName = "image";
            }

            String fileName = System.currentTimeMillis()
                    + "_"
                    + UUID.randomUUID().toString().substring(0, 8)
                    + "_"
                    + safeName;

            Path destination = uploadRoot.resolve(fileName).normalize();
            file.transferTo(destination.toFile());
            storedUrls.add("/uploads/" + fileName);
        }

        if (storedUrls.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        return storedUrls;
    }

    private void validateImage(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image allowed");
        }
    }
}
