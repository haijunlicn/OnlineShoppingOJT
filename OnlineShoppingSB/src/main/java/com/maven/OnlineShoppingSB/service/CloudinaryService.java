package com.maven.OnlineShoppingSB.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) throws IOException {
        try {
            // Add timeout and connection settings
            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                "resource_type", "auto",
                "timeout", 30000, // 30 seconds timeout
                "connection_timeout", 10000 // 10 seconds connection timeout
            );
            
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadOptions);
            return (String) result.get("secure_url");
        } catch (Exception e) {
            System.err.println("Cloudinary upload error: " + e.getMessage());
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    public String uploadFile(File file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file, ObjectUtils.emptyMap());
        return uploadResult.get("secure_url").toString();
    }
}
