package com.aurum;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
class AdminController {

  final CommerceService service;
  final Products productsRepo;
  final Orders ordersRepo;
  final Customers customersRepo;
  final Movements movementsRepo;

  AdminController(
    CommerceService s,
    Products p,
    Orders o,
    Customers c,
    Movements m
  ) {
    service = s;
    productsRepo = p;
    ordersRepo = o;
    customersRepo = c;
    movementsRepo = m;
  }

  @GetMapping("/products")
  List<Product> products() {
    return productsRepo.findAll(Sort.by("id").descending());
  }

  @PostMapping("/products")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  Product create(@Valid @RequestBody Dtos.ProductInput r) {
    return service.saveProduct(null, r);
  }

  @PutMapping("/products/{id}")
  Product update(
    @PathVariable Long id,
    @Valid @RequestBody Dtos.ProductInput r
  ) {
    return service.saveProduct(id, r);
  }

  @DeleteMapping("/products/{id}")
  Product deactivate(@PathVariable Long id) {
    return service.deactivate(id);
  }

  @PostMapping("/categories")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  Category createCategory(@Valid @RequestBody Dtos.CategoryInput r) {
    return service.category(null, r);
  }

  @PutMapping("/categories/{id}")
  Category updateCategory(
    @PathVariable Long id,
    @Valid @RequestBody Dtos.CategoryInput r
  ) {
    return service.category(id, r);
  }

  @DeleteMapping("/categories/{id}")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  void deleteCategory(@PathVariable Long id) {
    service.removeCategory(id);
  }

  @GetMapping("/customers")
  List<Map<String, Object>> customers() {
    return customersRepo
      .findAll(Sort.by("createdAt").descending())
      .stream()
      .map(Dtos::customer)
      .toList();
  }

  @GetMapping("/orders")
  @Transactional(readOnly = true)
  List<Map<String, Object>> orders() {
    return ordersRepo
      .findAll(Sort.by("createdAt").descending())
      .stream()
      .map(Dtos::order)
      .toList();
  }

  @PatchMapping("/orders/{id}/status")
  Map<String, Object> status(
    @PathVariable Long id,
    @Valid @RequestBody Dtos.Status r
  ) {
    return Dtos.order(service.status(id, r.status()));
  }

  @GetMapping("/inventory")
  List<InventoryMovement> inventory() {
    return movementsRepo.findTop100ByOrderByCreatedAtDesc();
  }

  @GetMapping("/stats")
  Map<String, Object> stats() {
    var orders = ordersRepo.findAll();
    Map<String, Long> byDate = new TreeMap<>();
    orders.forEach(o ->
      byDate.merge(
        o.createdAt.atZone(java.time.ZoneOffset.UTC).toLocalDate().toString(),
        1L,
        Long::sum
      )
    );
    return Map.of(
      "totalProducts",
      productsRepo.count(),
      "activeProducts",
      productsRepo.countByActiveTrue(),
      "lowStock",
      productsRepo.countByActiveTrueAndStockLessThanEqual(10),
      "totalOrders",
      orders.size(),
      "pendingOrders",
      ordersRepo.countByStatus("PENDING"),
      "demoRevenue",
      orders
        .stream()
        .filter(o -> !o.status.equals("CANCELLED"))
        .map(o -> o.total)
        .reduce(BigDecimal.ZERO, BigDecimal::add),
      "ordersByDate",
      byDate
    );
  }

  @GetMapping("/settings")
  Map<String, Object> settings() {
    return Map.of(
      "store",
      "AURUM Coffee",
      "currency",
      "USD",
      "checkoutMode",
      "DEMO — no payments or shipments",
      "lowStockThreshold",
      10,
      "imageMaxMb",
      5
    );
  }
}
