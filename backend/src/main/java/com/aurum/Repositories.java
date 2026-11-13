package com.aurum;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface Customers extends JpaRepository<Customer, Long> {
  Optional<Customer> findByEmail(String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from Customer c where c.id=:id")
  Optional<Customer> locked(@Param("id") Long id);
}

interface Categories extends JpaRepository<Category, Long> {}

interface Products
  extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product>
{
  Optional<Product> findBySlugAndActiveTrue(String slug);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Product p where p.id=:id")
  Optional<Product> locked(@Param("id") Long id);

  long countByActiveTrue();
  long countByActiveTrueAndStockLessThanEqual(int stock);
  boolean existsByCategoryId(Long id);
}

interface Orders extends JpaRepository<CoffeeOrder, Long> {
  List<CoffeeOrder> findByCustomerIdOrderByCreatedAtDesc(Long id);
  Optional<CoffeeOrder> findByCustomerIdAndIdempotencyKey(Long id, UUID key);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select o from CoffeeOrder o where o.id=:id")
  Optional<CoffeeOrder> locked(@Param("id") Long id);

  long countByStatus(String status);
}

interface Movements extends JpaRepository<InventoryMovement, Long> {
  List<InventoryMovement> findTop100ByOrderByCreatedAtDesc();
}
