# Switchable SMS services

Implemented in the working tree on 19 October 2026. Updated with a provider registry,
configuration-driven HTTPS integrations, generic encrypted credentials and dynamic
admin forms. See [integration guide](../backend/services/sms/README.md) and
[example profiles](../backend/sms-http-profiles.example.json).

## Usage

Open **Admin → Products → Tax & Shipping → SMS Service**.

1. Select SMS Gateway, Twilio, or an enabled provider profile. The current active service is shown separately.
2. Enter that service's credentials. Blank password/token fields retain its existing stored secret.
3. Enter a test recipient and click **Send test SMS**. This sends one real SMS using the draft configuration without activating or saving it. Provider charges may apply. Tests have a database-backed one-minute cooldown.
4. Check the recipient phone, then **Save Settings** to activate. Switching to an unconfigured service is rejected. Switching back reuses that provider's retained credentials.

Existing records default to SMS Gateway; no migration is needed for provider selection. Existing encrypted gateway passwords still follow the encryption migration instructions in `Security_Functionality_2026-10-19.md`.

## Implementation

- `backend/utils/smsService.js` keeps the existing `sendSMS(eventName, phone, payload)` boolean contract for OTP, order and prescription callers. `sendTextSMS` is the common transport entry point with structured results.
- `backend/services/sms/config.js` resolves and validates credentials using registry field definitions, with no credential mixing between services. Phone normalization supports Pakistani local numbers and international E.164 numbers.
- `backend/services/sms/registry.js` is the extension point for code-defined adapters. Common HTTPS services can instead be enabled through `SMS_HTTP_PROFILES_JSON`. Request bodies, auth, fields and response mapping are configured there, and admin fields are generated automatically. API requests cannot override deployment-controlled endpoints.
- SMS Gateway uses its documented [messages endpoint](https://docs.sms-gate.app/features/sending-messages/), HTTP Basic credentials and JSON body. Twilio uses the documented [Message resource](https://www.twilio.com/docs/messaging/api/message-resource), HTTP Basic credentials and form body. No external SDK dependency was added.
- Passwords/tokens are encrypted in the database. Public settings omit all SMS configuration. Admin settings return configured flags instead of secrets. Twilio environment variables are documented in `backend/.env.example`.
- Each request has a ten-second timeout. There is exactly one outbound attempt: no automatic retries or automatic provider fallback. A timeout, network failure or server error is marked **unknown**, because acceptance may have happened before the connection failed.
- Recent attempts are visible to admins only. Records contain event name, provider, acceptance state, provider message ID where supplied, safe error code and timestamp; no phone numbers, message bodies, OTPs or credentials. A MongoDB TTL index expires metadata after seven days (TTL cleanup is asynchronous).
- **Accepted** means the provider accepted the request, not confirmed handset delivery. Delivery webhooks/status polling are not implemented. Existing boolean callers return true for acceptance and false for rejected/unknown/skipped attempts.
- Changing providers does not modify existing OTP codes or expiry values. Existing resend behavior retains the prior valid code when a new request is not accepted.

## API

All new routes require an authenticated administrator:

- `POST /api/settings/sms/test` — `{ phone, configuration: { smsProvider, ...providerFields } }` tests draft configuration. Uses a fixed harmless test message, not caller-supplied message content.
- `GET /api/settings/sms/attempts` — newest 20 metadata records.
- Existing `PUT /api/settings` persists provider choice and credentials. Existing `GET /api/settings/admin` reads non-secret configuration and configured flags.

Twilio fields: `smsTwilioAccountSid`, `smsTwilioAuthToken`, `smsTwilioFrom`. Gateway fields remain `smsGatewayUsername` and `smsGatewayPassword`. Built-in provider IDs are `sms_gate` and `twilio`; additional IDs come from the registry. Generic field values use `smsConfiguration` on save/test requests.

## Verification and runtime

All **40 backend tests passed**, including provider request contracts, timeout/no-retry behavior, redacted errors, draft testing without activation, admin authorization/cooldown, encrypted credential preservation, activation/rollback, OTP event routing through Twilio, existing OTP recovery and checkout/account regressions. Every external SMS call in tests was mocked; no real SMS was sent.

Frontend production build passed and verified 333 case-sensitive relative imports. Targeted lint passed with the two existing settings-form effect rules disabled; a clean full lint run is not claimed. The existing bundle-size warning remains.

The running presentation backend retains old loaded modules and has not been restarted, preserving its temporary dataset and sessions. Restart/redeploy the backend to expose these routes; restarting `local-presentation-demo.mjs` recreates its temporary data and sessions. The new implementation was verified using an independent ephemeral test server, not the old running demo. Configurable profiles and credential persistence have API integration coverage; the generated frontend form has build/lint verification, not live browser verification. No live paid-provider credentials or delivery tests were available.
