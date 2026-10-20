# Adding an SMS service

OTP, order and prescription controllers call `sendSMS(eventName, phone, payload)`.
They never select credentials or vendor APIs. Admin forms and credential storage
are generated from provider definitions, so new services do not need controller,
model, logging or frontend changes.

## Common HTTP services: configuration only

Adapt an entry in `../../sms-http-profiles.example.json` to the provider's official
API documentation. Set `SMS_HTTP_PROFILES_JSON` in the backend environment to the
JSON array, then restart the backend. This is deployment configuration, not an
admin-editable endpoint: only trusted operators should control these URLs.

Each entry defines:

- A unique stable lowercase ID starting with `http_`, a display label, and an HTTPS endpoint.
- JSON or form-encoded POST body and credential/sender fields. Nested JSON and recipient arrays work.
- Bearer, Basic, API-key header or no built-in auth. Credentials can also be placed in POST body templates.
- Response success/failure values and nested message ID path, e.g. `data.messages.0.id`.
- Optional `phoneFormat`: `e164` (default), `international_digits` (without `+`) or `pakistan_local` (`03...`).

Templates support `{{phone}}`, `{{e164Phone}}`, `{{message}}` and
`{{field.yourFieldKey}}`. They substitute data, never evaluate code. JSON values
are encoded after substitution, so quotes and newlines remain valid JSON.

Fields use `{ "key": "apiKey", "label": "API key", "secret": true }`.
`required` defaults to true; use false for optional fields. Optional `env` names
allow a complete provider configuration to come from environment variables.
Stored/draft configurations are used as a group; credentials are not mixed with
environment fallbacks. Auth token/password fields are automatically marked secret.
Body-only credentials must explicitly have `secret: true`.

Once enabled, the service appears in **Tax & Shipping → SMS Service** with its own
fields. Enter credentials, send a draft test SMS, and save to activate. Blank
secret inputs preserve stored values. Secrets are encrypted and omitted from all
read responses; configured flags are returned instead. Removing a profile hides
its form but does not delete retained encrypted settings. Reusing an ID means
reusing that service's stored values; do not reuse IDs for unrelated vendors.

Profiles require explicit response mapping. Use `response.acceptHttpSuccess: true`
only for vendors whose documentation guarantees successful HTTP status means
acceptance. Otherwise use `successPath`/`successValues`, optionally
`failurePath`/`failureValues`. Unexpected response shapes are **unknown**, not
successful. Accepted is never claimed to mean delivery to the handset.

Profiles cannot receive endpoint overrides from a request, use URL credentials,
HTTP URLs, dynamic URL placeholders, JavaScript expressions or redirects. Keep
static URLs/headers/templates free of secrets; credentials belong in fields.
Host/transport/cookie header overrides are prohibited. The deployment operator
must choose a trusted provider endpoint; these trusted profiles are not intended
as a sandbox for untrusted URLs or untrusted DNS owners.

## Unusual HTTP APIs: a small code adapter

Add a definition (or import it from its own file) in `registry.js`:

```js
{
    id: "your_service", label: "Your Service",
    fields: [
        { key: "token", label: "API token", secret: true, required: true },
        { key: "sender", label: "Sender ID", required: true },
    ],
    request(config, phone, message) {
        return {
            url: "https://your-provider.example/send",
            method: "POST", // default; a trusted code adapter can choose another method
            headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ to: phone, text: message, sender: config.sender }),
        };
    },
    interpret(data) {
        if (data?.ok === true) return { status: "accepted", messageId: String(data.id).slice(0, 150) };
        if (data?.ok === false) return { status: "rejected", errorCode: "provider_rejected" };
        return { status: "unknown", errorCode: "unrecognized_response" };
    },
}
```

Use a stable lowercase ID matching `^[a-z][a-z0-9_]{0,63}$`. Field keys must be safe
identifiers and must not be `provider`, `constructor`, `prototype` or `__proto__`.
Optional `pattern` on a code-defined field validates a nonempty value. `request`
may be async. Use only safe result metadata; do not return raw vendor payloads.
Transport enforces a ten-second abort signal, blocks redirects, redacts raw errors
and performs one attempt. It accepts JSON responses for interpretation; XML/text
responses, OAuth token exchange, SDK-only/SMPP protocols or verified delivery
callbacks require additional adapter/transport work and provider-specific tests.
No design can integrate every protocol without some provider-specific code.

## Compatibility and tests

The original SMS Gateway and Twilio flat settings/API fields remain supported.
New integrations use `smsConfiguration: { fieldKey: "value" }` on save/test requests;
the active service is selected by `smsProvider`. Admin reads return
`smsProviders` metadata and `smsConfigurations[id].values/configured`. The generic
encrypted store is independent of provider count. Public settings include neither.

Run `npm test` from `backend`. Tests mock outbound SMS, cover JSON/form profiles,
authentication/body mapping, message escaping, phone formatting, rejection and
unknown responses, safe profile validation, discovery, encrypted storage, routing
and preservation. No real SMS is sent by the tests.
