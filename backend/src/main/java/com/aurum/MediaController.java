package com.aurum;

import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
class MediaController {

  final Path root;
  final org.springframework.jdbc.core.JdbcTemplate jdbc;

  MediaController(@Value("${app.uploads}") String dir, org.springframework.jdbc.core.JdbcTemplate jdbc)
    throws java.io.IOException {
    this.jdbc = jdbc;
    root = Path.of(dir).toAbsolutePath().normalize();
    Files.createDirectories(root);
  }

  @PostMapping("/api/v1/admin/images")
  @ResponseStatus(HttpStatus.CREATED)
  Map<String, String> upload(@RequestParam("file") MultipartFile file)
    throws java.io.IOException {
    if (
      file.isEmpty() ||
      file.getSize() > 5 * 1024 * 1024 ||
      !Set.of("image/jpeg", "image/png").contains(
        Objects.requireNonNullElse(file.getContentType(), "")
      )
    ) throw CommerceService.bad("Upload a JPEG or PNG, up to 5 MB.");
    try (var input = ImageIO.createImageInputStream(file.getInputStream())) {
      var readers = ImageIO.getImageReaders(input);
      if (!readers.hasNext()) throw CommerceService.bad("Invalid image.");
      var reader = readers.next();
      try {
        reader.setInput(input);
        if (
          reader.getWidth(0) > 5000 ||
          reader.getHeight(0) > 5000 ||
          reader.getWidth(0) * (long) reader.getHeight(0) > 16000000
        ) throw CommerceService.bad(
          "Image exceeds 16 megapixels or 5000px per side."
        );
        var image = reader.read(0);
        String ext = file.getContentType().equals("image/png") ? "png" : "jpg";
        String name = UUID.randomUUID() + "." + ext;
        var bytes = new java.io.ByteArrayOutputStream();
        ImageIO.write(image, ext, bytes);
        jdbc.update("INSERT INTO product_media (name, content) VALUES (?, ?)", name, bytes.toByteArray());
        return Map.of("url", "/api/v1/media/" + name);
      } finally {
        reader.dispose();
      }
    }
  }

  @GetMapping("/api/v1/media/{name}")
  ResponseEntity<Resource> read(@PathVariable String name) {
    if (
      !name.matches("[a-f0-9-]{36}\\.(png|jpg)")
    ) throw CommerceService.missing();
    var stored = jdbc.query("SELECT content FROM product_media WHERE name = ?", (rs, row) -> rs.getBytes(1), name);
    if (!stored.isEmpty()) {
      return ResponseEntity.ok()
        .contentType(name.endsWith("png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG)
        .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(7)))
        .body(new ByteArrayResource(stored.getFirst()));
    }
    // Existing local uploads remain readable while new files use persistent storage.
    Path path = root.resolve(name).normalize();
    if (
      !path.startsWith(root) || !Files.isRegularFile(path)
    ) throw CommerceService.missing();
    return ResponseEntity.ok()
      .contentType(
        name.endsWith("png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG
      )
      .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(7)))
      .body(new FileSystemResource(path));
  }
}
