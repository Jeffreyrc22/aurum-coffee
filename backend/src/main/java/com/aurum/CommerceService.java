package com.aurum;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
class CommerceService {

  final Products products;
  final Categories categories;
  final Orders orders;
  final Customers users;
  final Movements movements;

  CommerceService(
    Products p,
    Categories c,
    Orders o,
    Customers u,
    Movements m
  ) {
    products = p;
    categories = c;
    orders = o;
    users = u;
    movements = m;
  }

  static ResponseStatusException bad(String message) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
  }

  static ResponseStatusException missing() {
    return new ResponseStatusException(
      HttpStatus.NOT_FOUND,
      "Record not found."
    );
  }

  static void imagePath(String path) {
    if (
      path == null ||
      !path.matches(
        "/(images/[a-z0-9-]+\\.svg|api/v1/media/[a-f0-9-]+\\.(png|jpg))"
      )
    ) throw bad("Choose an uploaded image or a supplied product illustration.");
  }

  @Transactional
  Product saveProduct(Long id, Dtos.ProductInput r) {
    Product p =
      id == null
        ? new Product()
        : products.locked(id).orElseThrow(CommerceService::missing);
    if (
      id != null && p.version != r.version()
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Product changed. Refresh before editing."
    );
    imagePath(r.mainImage());
    r.galleryImages().forEach(CommerceService::imagePath);
    int before = p.stock;
    p.name = r.name().trim();
    p.slug = r.slug();
    p.shortDescription = r.shortDescription().trim();
    p.description = r.description().trim();
    p.price = r.price();
    p.category = categories
      .findById(r.categoryId())
      .orElseThrow(CommerceService::missing);
    p.origin = r.origin().trim();
    p.roastLevel = r.roastLevel();
    p.weight = r.weight();
    p.stock = r.stock();
    p.mainImage = r.mainImage();
    p.galleryImages.clear();
    p.galleryImages.addAll(r.galleryImages());
    p.active = r.active();
    p.featured = r.featured();
    products.saveAndFlush(p);
    if (before != p.stock) movements.save(
      new InventoryMovement(
        p.id,
        p.stock - before,
        id == null ? "ADMIN_INITIAL_STOCK" : "ADMIN_ADJUSTMENT"
      )
    );
    return p;
  }

  @Transactional
  Product deactivate(Long id) {
    Product p = products.locked(id).orElseThrow(CommerceService::missing);
    p.active = false;
    return products.save(p);
  }

  @Transactional
  Category category(Long id, Dtos.CategoryInput r) {
    Category c =
      id == null
        ? new Category()
        : categories.findById(id).orElseThrow(CommerceService::missing);
    c.name = r.name().trim();
    c.slug = r.slug();
    return categories.save(c);
  }

  @Transactional
  void removeCategory(Long id) {
    if (products.existsByCategoryId(id)) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Reassign this category's products first."
    );
    categories.delete(
      categories.findById(id).orElseThrow(CommerceService::missing)
    );
  }

  @Transactional
  CoffeeOrder checkout(Long userId, Dtos.Checkout r) {
    users.locked(userId).orElseThrow(CommerceService::missing);
    var prior = orders.findByCustomerIdAndIdempotencyKey(
      userId,
      r.idempotencyKey()
    );
    if (prior.isPresent()) return prior.get();
    var quantities = new TreeMap<Long, Integer>();
    for (var item : r.items()) {
      if (quantities.put(item.productId(), item.quantity()) != null) throw bad(
        "Duplicate product in cart."
      );
    }
    CoffeeOrder order = new CoffeeOrder();
    order.customerId = userId;
    order.idempotencyKey = r.idempotencyKey();
    order.reference =
      "AUR-" + UUID.randomUUID().toString().toUpperCase(Locale.ROOT);
    order.recipient = r.recipient().trim();
    order.address = r.address().trim();
    order.city = r.city().trim();
    order.postalCode = r.postalCode().trim();
    order.country = r.country().trim();
    order.total = BigDecimal.ZERO;
    for (var entry : quantities.entrySet()) {
      Product p = products
        .locked(entry.getKey())
        .orElseThrow(CommerceService::missing);
      int qty = entry.getValue();
      if (!p.active || p.stock < qty) throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Insufficient stock for " + p.name + ". Refresh your cart."
      );
      p.stock -= qty;
      OrderItem i = new OrderItem();
      i.order = order;
      i.productId = p.id;
      i.name = p.name;
      i.price = p.price;
      i.quantity = qty;
      order.items.add(i);
      order.total = order.total.add(p.price.multiply(BigDecimal.valueOf(qty)));
      movements.save(new InventoryMovement(p.id, -qty, "ORDER_RESERVED"));
    }
    return orders.saveAndFlush(order);
  }

  static final Map<String, Set<String>> TRANSITIONS = Map.of(
    "PENDING",
    Set.of("CONFIRMED", "CANCELLED"),
    "CONFIRMED",
    Set.of("PROCESSING", "CANCELLED"),
    "PROCESSING",
    Set.of("SHIPPED", "CANCELLED"),
    "SHIPPED",
    Set.of("COMPLETED"),
    "COMPLETED",
    Set.of(),
    "CANCELLED",
    Set.of()
  );

  @Transactional
  CoffeeOrder status(Long id, String next) {
    CoffeeOrder o = orders.locked(id).orElseThrow(CommerceService::missing);
    if (o.status.equals(next)) return o;
    if (
      !TRANSITIONS.get(o.status).contains(next)
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Invalid transition from " + o.status + " to " + next
    );
    if (next.equals("CANCELLED")) {
      for (var item : o.items
        .stream()
        .sorted(Comparator.comparing(i -> i.productId))
        .toList()) {
        Product p = products
          .locked(item.productId)
          .orElseThrow(CommerceService::missing);
        p.stock += item.quantity;
        movements.save(
          new InventoryMovement(p.id, item.quantity, "ORDER_CANCELLED")
        );
      }
    }
    o.status = next;
    return orders.save(o);
  }
}
