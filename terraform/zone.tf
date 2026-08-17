resource "cloudflare_zone_setting" "free" {
  for_each = {
    ssl                      = "strict"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    brotli                   = "on"
    security_level           = "high"
    browser_check            = "on"
    tls_1_3                  = "on"
    opportunistic_encryption = "on"
    min_tls_version          = "1.3"
  }
  zone_id    = var.zone_id
  setting_id = each.key
  value      = each.value
}

variable "zone_id" {
  type = string
}

resource "cloudflare_ruleset" "api_rate_limiting" {
  zone_id     = var.zone_id
  name        = "Rate Limit API Routes"
  description = "Protect D1 writes and Turnstile verification from automated abuse"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [
    {
      action      = "block"
      description = "Rate limit /api/* routes to max 30 requests per minute per IP"
      enabled     = true
      expression  = "starts_with(http.request.uri.path, \"/api/\")"
      ratelimit = {
        characteristics     = ["cf.colo.id", "ip.src"]
        period              = 10
        requests_per_period = 30
        mitigation_timeout  = 10
      }
    }
  ]
}
