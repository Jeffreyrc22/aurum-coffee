package com.aurum;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
class AdminBootstrap implements ApplicationRunner {

  private final Customers users;
  private final PasswordEncoder encoder;
  private final String email, password;

  AdminBootstrap(
    Customers u,
    PasswordEncoder e,
    @Value("${app.admin-email}") String mail,
    @Value("${app.admin-password}") String pass
  ) {
    users = u;
    encoder = e;
    email = mail.trim().toLowerCase(java.util.Locale.ROOT);
    password = pass;
  }

  public void run(ApplicationArguments args) {
    if (email.isBlank() && password.isBlank()) return;
    if (
      !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+") ||
      password.length() < 16 ||
      password.length() > 64
    ) throw new IllegalStateException(
      "Set a valid ADMIN_EMAIL and ADMIN_PASSWORD of 16–64 characters, or omit both."
    );
    AuthController.password(password, password);
    var existing = users.findByEmail(email);
    if (existing.isPresent()) {
      if (!existing.get().role.equals("ADMIN")) throw new IllegalStateException(
        "Admin bootstrap refuses to promote an existing customer."
      );
      return;
    }
    Customer c = new Customer();
    c.firstName = "Aurum";
    c.lastName = "Administrator";
    c.email = email;
    c.passwordHash = encoder.encode(password);
    c.role = "ADMIN";
    users.save(c);
  }
}
