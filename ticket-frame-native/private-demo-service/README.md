# Ticket Frame private demo service

Cloudflare Worker + D1 service for private browser demos.

Security properties:

- Creation requires the private `OWNER_CODE` Worker secret.
- A 256-bit random link token is stored only as a SHA-256 hash.
- The first browser atomically redeems the link and receives an HttpOnly,
  Secure, SameSite session cookie.
- Later visits work only in that browser; forwarding the URL returns Gone.
- Links expire after seven days if not redeemed.
- Pages are no-index, no-store, non-embeddable and visibly watermarked.
- The app sends an allow-listed snapshot with no image/video URI, ticket scan
  name, fingerprint, original holder name, fan ID, ticket number, note or GPS.

Browser code cannot reliably detect or prevent operating-system screen
recording. Playback pauses when the page is hidden or loses focus, but this is
not represented as capture protection.

Deployment requires a D1 database, `OWNER_CODE` secret, `PUBLIC_ORIGIN`
variable and the deployed origin added to `expo.extra.privateDemoServiceUrl`.
