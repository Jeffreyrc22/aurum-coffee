package com.aurum;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "users")
class Customer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String firstName, lastName, email, passwordHash, role;
  public Instant createdAt = Instant.now();
}

@Entity
@Table(name = "categories")
class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String name, slug;
}

@Entity
@Table(name = "products")
class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String name, slug, shortDescription;

  @Column(columnDefinition = "text")
  public String description;

  @Column(precision = 12, scale = 2)
  public BigDecimal price;

  public String currency = "USD";

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "category_id")
  public Category category;

  public String origin, roastLevel, mainImage;
  public int weight, stock;
  public boolean active = true,
    featured;

  @Version
  public long version;

  public Instant createdAt = Instant.now(),
    updatedAt = Instant.now();

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(
    name = "product_images",
    joinColumns = @JoinColumn(name = "product_id")
  )
  @Column(name = "image_url")
  @OrderColumn(name = "position")
  public List<String> galleryImages = new ArrayList<>();

  @PreUpdate
  void updateTime() {
    updatedAt = Instant.now();
  }
}

@Entity
@Table(name = "orders")
class CoffeeOrder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String reference,
    status = "PENDING",
    currency = "USD",
    recipient,
    address,
    city,
    postalCode,
    country;
  public Long customerId;
  public UUID idempotencyKey;

  @Column(precision = 12, scale = 2)
  public BigDecimal total;

  public Instant createdAt = Instant.now();

  @OneToMany(
    mappedBy = "order",
    cascade = CascadeType.ALL,
    fetch = FetchType.EAGER
  )
  public List<OrderItem> items = new ArrayList<>();
}

@Entity
@Table(name = "order_items")
class OrderItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne
  @JoinColumn(name = "order_id")
  public CoffeeOrder order;

  public Long productId;
  public String name;

  @Column(precision = 12, scale = 2)
  public BigDecimal price;

  public int quantity;
}

@Entity
@Table(name = "inventory_movements")
class InventoryMovement {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long productId;
  public int delta;
  public String reason;
  public Instant createdAt = Instant.now();

  InventoryMovement() {}

  InventoryMovement(Long id, int delta, String reason) {
    this.productId = id;
    this.delta = delta;
    this.reason = reason;
  }
}
