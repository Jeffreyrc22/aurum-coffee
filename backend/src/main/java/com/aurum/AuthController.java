package com.aurum;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.*;
import org.springframework.security.core.context.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
class AuthController {

  private final Customers users;
  private final PasswordEncoder encoder;
  private final AuthenticationManager manager;
  private final SecurityContextRepository contexts;
  private final FindByIndexNameSessionRepository<? extends Session> sessions;
  private final Map<String, List<Long>> attempts = new ConcurrentHashMap<>();

  AuthController(
    Customers u,
    PasswordEncoder e,
    AuthenticationManager m,
    SecurityContextRepository c,
    FindByIndexNameSessionRepository<? extends Session> s
  ) {
    users = u;
    encoder = e;
    manager = m;
    contexts = c;
    sessions = s;
  }

  @GetMapping("/auth/csrf")
  Map<String, String> csrf(CsrfToken token) {
    return Map.of(
      "token",
      token.getToken(),
      "headerName",
      token.getHeaderName()
    );
  }

  private synchronized void limit(HttpServletRequest req) {
    long now = System.currentTimeMillis();
    attempts.entrySet().removeIf(e ->
      e
        .getValue()
        .stream()
        .allMatch(t -> t < now - 60000)
    );
    List<Long> times = attempts.computeIfAbsent(req.getRemoteAddr(), k ->
      new ArrayList<>()
    );
    times.removeIf(t -> t < now - 60000);
    if (times.size() >= 20) throw new ResponseStatusException(
      HttpStatus.TOO_MANY_REQUESTS,
      "Too many attempts. Try again in a minute."
    );
    times.add(now);
  }

  static void password(String value, String confirm) {
    if (
      !value.equals(confirm) ||
      value.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Passwords must match and fit within 72 UTF-8 bytes."
    );
  }

  @PostMapping("/auth/register")
  @ResponseStatus(HttpStatus.CREATED)
  Map<String, Object> register(
    @Valid @RequestBody Dtos.Register r,
    HttpServletRequest request
  ) {
    limit(request);
    password(r.password(), r.confirmPassword());
    Customer c = new Customer();
    c.email = r.email().trim().toLowerCase(Locale.ROOT);
    if (
      users.findByEmail(c.email).isPresent()
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Unable to register this email."
    );
    c.firstName = r.firstName().trim();
    c.lastName = r.lastName().trim();
    c.passwordHash = encoder.encode(r.password());
    c.role = "CUSTOMER";
    return Dtos.customer(users.save(c));
  }

  @PostMapping("/auth/login")
  Map<String, Object> login(
    @Valid @RequestBody Dtos.Login r,
    HttpServletRequest request,
    HttpServletResponse response
  ) {
    limit(request);
    try {
      Authentication auth = manager.authenticate(
        UsernamePasswordAuthenticationToken.unauthenticated(
          r.email().toLowerCase(Locale.ROOT).trim(),
          r.password()
        )
      );
      if (request.getSession(false) != null) request.changeSessionId();
      SecurityContext context = SecurityContextHolder.createEmptyContext();
      context.setAuthentication(auth);
      SecurityContextHolder.setContext(context);
      contexts.saveContext(context, request, response);
      return Dtos.customer(current(auth));
    } catch (AuthenticationException ex) {
      throw new ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "Email or password is incorrect."
      );
    }
  }

  Customer current(Authentication a) {
    return users
      .findByEmail(a.getName())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
  }

  @GetMapping("/users/me")
  Map<String, Object> me(Authentication a) {
    return Dtos.customer(current(a));
  }

  @PutMapping("/users/me")
  @Transactional
  Map<String, Object> profile(
    Authentication a,
    @Valid @RequestBody Dtos.Profile r
  ) {
    Customer c = current(a);
    c.firstName = r.firstName().trim();
    c.lastName = r.lastName().trim();
    return Dtos.customer(users.save(c));
  }

  @PutMapping("/users/me/password")
  @Transactional
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void change(Authentication a, @Valid @RequestBody Dtos.Password r) {
    Customer c = current(a);
    if (
      !encoder.matches(r.currentPassword(), c.passwordHash)
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Current password is incorrect."
    );
    password(r.password(), r.confirmPassword());
    c.passwordHash = encoder.encode(r.password());
    users.save(c);
    sessions
      .findByPrincipalName(c.email)
      .keySet()
      .forEach(sessions::deleteById);
    SecurityContextHolder.clearContext();
  }
}
