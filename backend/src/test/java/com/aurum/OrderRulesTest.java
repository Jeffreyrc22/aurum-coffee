package com.aurum;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class OrderRulesTest {

  @Test
  void completedAndCancelledAreTerminal() {
    assertTrue(CommerceService.TRANSITIONS.get("COMPLETED").isEmpty());
    assertTrue(CommerceService.TRANSITIONS.get("CANCELLED").isEmpty());
  }

  @Test
  void shippingCannotBeCancelledOrSkipped() {
    assertFalse(
      CommerceService.TRANSITIONS.get("SHIPPED").contains("CANCELLED")
    );
    assertFalse(
      CommerceService.TRANSITIONS.get("PENDING").contains("COMPLETED")
    );
  }

  @Test
  void rejectsUnsafeImageReferences() {
    assertThrows(RuntimeException.class, () ->
      CommerceService.imagePath("../../secret")
    );
    assertThrows(RuntimeException.class, () ->
      CommerceService.imagePath("https://remote.example/image.svg")
    );
    assertDoesNotThrow(() ->
      CommerceService.imagePath("/images/coffee-cream.svg")
    );
  }

  @Test
  void checksBcryptByteLimitAndConfirmation() {
    assertThrows(RuntimeException.class, () ->
      AuthController.password("different", "confirmation")
    );
    assertThrows(RuntimeException.class, () ->
      AuthController.password("界".repeat(30), "界".repeat(30))
    );
  }
}
