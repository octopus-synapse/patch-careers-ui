# Universal Links / App Links verification files

Served by nginx at `/.well-known/` on patchcareers.org (see `deploy/nginx.conf`).
`app.json` points both platforms here (`associatedDomains` / `intentFilters`).

Two values must be filled from the signing credentials before the links open
the app — until then the files are structurally valid and simply fail
verification, which is the same outcome as not serving them:

- `apple-app-site-association` → replace `APPLE_TEAM_ID` with the Team ID
  (Apple Developer → Membership).
- `assetlinks.json` → replace `ANDROID_RELEASE_CERT_SHA256` with the release
  keystore fingerprint (`eas credentials` → Android → SHA-256, colon-separated
  uppercase hex).

Apple requires `application/json` with no extension; nginx sets it explicitly.
