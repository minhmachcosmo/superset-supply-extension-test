PREVENT_UNSAFE_DB_CONNECTIONS = False

# Autoriser le frontend dev server (port 9000) a communiquer avec le backend
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": {"/*": {"origins": ["http://localhost:9000", "http://localhost:8088"]}},
}
ENABLE_CORS = True

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
