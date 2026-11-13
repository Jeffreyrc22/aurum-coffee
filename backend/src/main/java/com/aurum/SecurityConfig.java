package com.aurum;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;

@Configuration
class SecurityConfig {

  @Bean
  PasswordEncoder encoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  UserDetailsService details(Customers users) {
    return email -> {
      Customer c = users
        .findByEmail(email.toLowerCase(java.util.Locale.ROOT).trim())
        .orElseThrow(() ->
          new UsernameNotFoundException("Invalid credentials")
        );
      return User.withUsername(c.email)
        .password(c.passwordHash)
        .roles(c.role)
        .build();
    };
  }

  @Bean
  AuthenticationManager manager(
    UserDetailsService details,
    PasswordEncoder encoder
  ) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider(details);
    provider.setPasswordEncoder(encoder);
    return new ProviderManager(provider);
  }

  @Bean
  SecurityContextRepository contexts() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  SecurityFilterChain chain(
    HttpSecurity http,
    SecurityContextRepository repository
  ) throws Exception {
    http
      .securityContext(c -> c.securityContextRepository(repository))
      .authorizeHttpRequests(a ->
        a
          .requestMatchers(
            "/api/v1/admin/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**"
          )
          .hasRole("ADMIN")
          .requestMatchers(
            HttpMethod.GET,
            "/api/v1/products/**",
            "/api/v1/categories",
            "/api/v1/catalog-meta",
            "/api/v1/auth/csrf",
            "/api/v1/media/**",
            "/actuator/health"
          )
          .permitAll()
          .requestMatchers(
            HttpMethod.POST,
            "/api/v1/auth/register",
            "/api/v1/auth/login"
          )
          .permitAll()
          .anyRequest()
          .authenticated()
      )
      .csrf(c -> c.csrfTokenRepository(new HttpSessionCsrfTokenRepository()))
      .requestCache(c -> c.disable())
      .formLogin(c -> c.disable())
      .httpBasic(c -> c.disable())
      .logout(c ->
        c
          .logoutUrl("/api/v1/auth/logout")
          .logoutSuccessHandler((req, res, auth) -> res.setStatus(204))
          .invalidateHttpSession(true)
          .clearAuthentication(true)
          .deleteCookies("SESSION")
      )
      .exceptionHandling(c ->
        c
          .authenticationEntryPoint((req, res, e) -> {
            res.setStatus(401);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Please sign in.\"}");
          })
          .accessDeniedHandler((req, res, e) -> {
            res.setStatus(403);
            res.setContentType("application/json");
            res
              .getWriter()
              .write(
                "{\"message\":\"Access denied or session security token expired. Refresh and retry.\"}"
              );
          })
      )
      .headers(c -> c.contentTypeOptions(o -> {}).frameOptions(o -> o.deny()));
    return http.build();
  }
}
