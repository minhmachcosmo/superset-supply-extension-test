PREVENT_UNSAFE_DB_CONNECTIONS = False

# Disable HTTP compression so the webpack dev-server proxy never receives
# gzip/brotli bytes that it has to decompress (avoids garbled content on Windows).
COMPRESS_REGISTER = False
COMPRESS_ENABLED = False

# Session cookie accessible depuis le dev server
SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = False

WTF_CSRF_ENABLED = False

# Desactiver la politique CSP (Content Security Policy) pour le developpement local
TALISMAN_ENABLED = False
TALISMAN_CONFIG = {
    "content_security_policy": False,
    "force_https": False,
    "force_https_permanent": False,
}
