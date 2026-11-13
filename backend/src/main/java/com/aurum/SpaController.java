package com.aurum;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
class SpaController {
  @GetMapping({"/", "/shop", "/shop/{slug}", "/our-story", "/contact", "/login", "/register", "/cart", "/checkout", "/account", "/account/orders", "/admin", "/admin/{section}", "/admin/{section}/{id}"})
  String app() { return "forward:/index.html"; }
}
