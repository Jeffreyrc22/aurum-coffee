package com.aurum;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;

class Dtos {

  record Register(
    @NotBlank @Size(max = 80) String firstName,
    @NotBlank @Size(max = 80) String lastName,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(min = 12, max = 64) String password,
    @NotBlank String confirmPassword
  ) {}

  record Login(@NotBlank @Email String email, @NotBlank String password) {}

  record Profile(
    @NotBlank @Size(max = 80) String firstName,
    @NotBlank @Size(max = 80) String lastName
  ) {}

  record Password(
    @NotBlank String currentPassword,
    @NotBlank @Size(min = 12, max = 64) String password,
    @NotBlank String confirmPassword
  ) {}

  record CategoryInput(
    @NotBlank @Size(max = 80) String name,
    @NotBlank
    @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*")
    @Size(max = 100)
    String slug
  ) {}

  record ProductInput(
    @NotBlank @Size(max = 120) String name,
    @NotBlank
    @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*")
    @Size(max = 150)
    String slug,
    @NotBlank @Size(max = 240) String shortDescription,
    @NotBlank @Size(max = 10000) String description,
    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("999999.99")
    @Digits(integer = 6, fraction = 2)
    BigDecimal price,
    @NotNull Long categoryId,
    @NotBlank @Size(max = 100) String origin,
    @NotNull
    @Pattern(regexp = "Light|Medium|Medium-dark|Dark")
    String roastLevel,
    @Min(1) @Max(10000) int weight,
    @Min(0) @Max(100000) int stock,
    @NotBlank @Size(max = 300) String mainImage,
    @NotNull @Size(max = 8) List<@Size(max = 300) String> galleryImages,
    boolean active,
    boolean featured,
    @Min(0) long version
  ) {}

  record CartLine(@NotNull Long productId, @Min(1) @Max(99) int quantity) {}

  record Checkout(
    @NotNull UUID idempotencyKey,
    @NotEmpty @Size(max = 50) List<@Valid CartLine> items,
    @NotBlank @Size(max = 160) String recipient,
    @NotBlank @Size(max = 300) String address,
    @NotBlank @Size(max = 100) String city,
    @NotBlank @Size(max = 30) String postalCode,
    @NotBlank @Size(max = 100) String country
  ) {}

  record Status(
    @NotNull
    @Pattern(
      regexp = "PENDING|CONFIRMED|PROCESSING|SHIPPED|COMPLETED|CANCELLED"
    )
    String status
  ) {}

  static Map<String, Object> customer(Customer c) {
    return Map.of(
      "id",
      c.id,
      "firstName",
      c.firstName,
      "lastName",
      c.lastName,
      "email",
      c.email,
      "role",
      c.role,
      "createdAt",
      c.createdAt
    );
  }

  static Map<String, Object> order(CoffeeOrder o) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", o.id);
    m.put("reference", o.reference);
    m.put("status", o.status);
    m.put("total", o.total);
    m.put("currency", o.currency);
    m.put("createdAt", o.createdAt);
    m.put("recipient", o.recipient);
    m.put("address", o.address);
    m.put("city", o.city);
    m.put("postalCode", o.postalCode);
    m.put("country", o.country);
    m.put(
      "items",
      o.items
        .stream()
        .map(i ->
          Map.of(
            "productId",
            i.productId,
            "name",
            i.name,
            "price",
            i.price,
            "quantity",
            i.quantity
          )
        )
        .toList()
    );
    return m;
  }
}
