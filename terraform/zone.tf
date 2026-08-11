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

# resource "cloudflare_ruleset" "free_waf_rules" {
# zone_id    = var.zone_id
# name        = "Free Tier WAF and API Protection Rules"
#   description = "Rate limiting and bot mitigation rules for API endpoints"
#   kind        = "zone"
#   phase       = "http_request_firewall_custom"

# }