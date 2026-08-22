# VEDED Auth Testing

Token-based auth (JWT in localStorage, sent via `Authorization: Bearer`). No cookies.

## Accounts
- Admin: admin@veded.app / VededAdmin@2026 (role admin)
- New users get 60 credits on register.

## API
- POST /api/auth/register {name,email,password} -> {token, user}
- POST /api/auth/login {email,password} -> {token, user}
- GET  /api/auth/me  (Authorization: Bearer <token>) -> user

## Quick curl
```
API=http://localhost:8001/api
TOKEN=$(curl -s -X POST $API/auth/register -H "Content-Type: application/json" -d '{"name":"T","email":"t1@veded.app","password":"Test@1234"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s $API/auth/me -H "Authorization: Bearer $TOKEN"
curl -s -X POST $API/generate/image -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"prompt":"a cat","model":"flux-dev"}'
```
