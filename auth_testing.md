# VEDED Auth Testing (Email/Password + Emergent Google)

The app uses **JWT Bearer tokens** (localStorage `veded_token`, user cached in `veded_user`).
Google login reuses the SAME JWT scheme — the backend exchanges the Emergent `session_id`
server-side and issues a normal JWT. No cookies / no `user_sessions` collection.

## Endpoints
- POST /api/auth/signup {email,password,name} -> {token, user}
- POST /api/auth/login   {email,password}      -> {token, user}
- POST /api/auth/google/session {session_id}   -> {token, user}   (Google)
- GET  /api/auth/me      (Authorization: Bearer <token>) -> {user}

## Google flow
1. Frontend button -> `https://auth.emergentagent.com/?redirect=${window.location.origin}/app`
2. User returns to `{origin}/app#session_id=<id>`.
3. AppRouter (App.js) detects `location.hash` contains `session_id=` and renders `<AuthCallback/>`.
4. AuthCallback (pages/AuthCallback.jsx) reads session_id, POSTs `/api/auth/google/session`.
5. Backend GET `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data`
   with header `X-Session-ID`, upserts the user by email, returns a JWT.
6. Frontend persists token+user and navigates to `/app`.

## Backend checks
- Invalid/expired session_id -> Emergent returns non-200 -> our endpoint returns 401.
- Existing email user signing in with Google -> account is linked (matched by email), same user id.

## Manual backend check
```
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/api/auth/google/session \
  -H "Content-Type: application/json" -d '{"session_id":"fake"}'   # expect 401
```
Full OAuth requires a real Google account via the hosted Emergent auth page (cannot be fully
scripted headlessly). Verify the button renders and redirects to auth.emergentagent.com.

## Test identities
- Email/password test user: realtest@veded.app / Test@1234
- Google: use any real Google account on the Emergent auth screen; the linked app user is keyed by email.
