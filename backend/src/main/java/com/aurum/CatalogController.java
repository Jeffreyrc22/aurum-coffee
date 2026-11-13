package com.aurum;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class CatalogController {

  final Products products;
  final Categories categories;
  final Orders orders;
  final AuthController auth;
  final CommerceService service;

  CatalogController(
    Products p,
    Categories c,
    Orders o,
    AuthController a,
    CommerceService s
  ) {
    products = p;
    categories = c;
    orders = o;
    auth = a;
    service = s;
  }

  @GetMapping("/products")
  @Transactional(readOnly = true)
  Map<String, Object> list(
    @RequestParam(defaultValue = "") String q,
    @RequestParam(required = false) Long category,
    @RequestParam(required = false) String origin,
    @RequestParam(required = false) BigDecimal minPrice,
    @RequestParam(required = false) BigDecimal maxPrice,
    @RequestParam(defaultValue = "false") boolean featured,
    @RequestParam(defaultValue = "name") String sort,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "9") int size
  ) {
    if (
      page < 0 || size < 1 || size > 50 || q.length() > 100
    ) throw CommerceService.bad("Invalid pagination or search.");
    Specification<Product> spec = (root, query, cb) ->
      cb.isTrue(root.get("active"));
    if (!q.isBlank()) spec = spec.and((r, query, cb) ->
      cb.like(
        cb.lower(r.get("name")),
        "%" +
          q.toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") +
          "%",
        '\\'
      )
    );
    if (category != null) spec = spec.and((r, query, cb) ->
      cb.equal(r.get("category").get("id"), category)
    );
    if (origin != null && !origin.isBlank()) spec = spec.and((r, query, cb) ->
      cb.equal(r.get("origin"), origin)
    );
    if (minPrice != null) spec = spec.and((r, query, cb) ->
      cb.ge(r.get("price"), minPrice)
    );
    if (maxPrice != null) spec = spec.and((r, query, cb) ->
      cb.le(r.get("price"), maxPrice)
    );
    if (featured) spec = spec.and((r, query, cb) ->
      cb.isTrue(r.get("featured"))
    );
    Sort ordering = switch (sort) {
      case "price-asc" -> Sort.by("price");
      case "price-desc" -> Sort.by("price").descending();
      case "newest" -> Sort.by("createdAt").descending();
      default -> Sort.by("name");
    };
    Page<Product> result = products.findAll(
      spec,
      PageRequest.of(page, size, ordering.and(Sort.by("id")))
    );
    return Map.of(
      "items",
      result.getContent(),
      "total",
      result.getTotalElements(),
      "pages",
      result.getTotalPages(),
      "page",
      page
    );
  }

  @GetMapping("/products/{id}")
  Product product(@PathVariable Long id) {
    return products
      .findById(id)
      .filter(p -> p.active)
      .orElseThrow(CommerceService::missing);
  }

  @GetMapping("/products/slug/{slug}")
  Product slug(@PathVariable String slug) {
    return products
      .findBySlugAndActiveTrue(slug)
      .orElseThrow(CommerceService::missing);
  }

  @GetMapping("/categories")
  List<Category> categories() {
    return categories.findAll(Sort.by("name"));
  }

  @GetMapping("/catalog-meta")
  Map<String, Object> meta() {
    return Map.of(
      "origins",
      products
        .findAll(
          (Specification<Product>) (r, q, b) -> b.isTrue(r.get("active"))
        )
        .stream()
        .map(p -> p.origin)
        .distinct()
        .sorted()
        .toList()
    );
  }

  @PostMapping("/orders")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  Map<String, Object> order(
    Authentication a,
    @Valid @RequestBody Dtos.Checkout r
  ) {
    return Dtos.order(service.checkout(auth.current(a).id, r));
  }

  @GetMapping("/orders/my")
  @Transactional(readOnly = true)
  List<Map<String, Object>> mine(Authentication a) {
    return orders
      .findByCustomerIdOrderByCreatedAtDesc(auth.current(a).id)
      .stream()
      .map(Dtos::order)
      .toList();
  }
}
