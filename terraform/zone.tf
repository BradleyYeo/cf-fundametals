resource "cloudfalre_zone_setting" "free" {
  for_each = {
    ssl                      = "strict"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    brotli                   = "on"
    security_level           = "high"
    browser_check = "on"
    tls_1_3 = "on"
    
  }
}