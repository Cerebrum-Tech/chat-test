# Integrations

**Updated:** 2026-07-21

## Global CAICore frontend

The primary integration is the global React and Vite frontend loaded directly by components/ChatWebView.tsx. The native application does not build an inline wrapper, relay through an iframe, or own the chat client.

Configure the source with EXPO_PUBLIC_CAI_FRONTEND_URL. The URL must be valid HTTP(S) and reachable from the target device or emulator.

## Global CAICore API

EXPO_PUBLIC_CAI_API_BASE_URL is an optional runtime override. services/webViewBootstrap.ts assigns a nonblank value to window.__CAI_API_BASE_URL__ before frontend content runs. If omitted, the frontend uses its own same-origin or configured fallback behavior.

The global frontend, not this host:

- creates and reads conversations through the public REST API;
- appends user messages through REST;
- opens the conversation SSE stream;
- consumes live message and assistant completion events;
- prevents restored or refetched history from replaying native actions.

## Authentication

The current Erikli channel has `auth.enabled: false`, so the smoke checklist targets direct frontend loading and conversation REST/SSE without login. The native host does not create, store, refresh, or inject a token. If auth is enabled in a future target, the global AuthProvider remains the only permitted token owner.

Auth-enabled Expo hosting is currently unsupported. Cross-origin HTTP(S) is opened outside the WebView, and no tested callback returns a system-browser auth result while preserving the WebView session context. A system-browser/deep-link callback and session handoff require a separate design and device test before auth can be enabled for this host.

## Public user context

The native host may expose four optional properties through window.__CHAT_BACKEND_CONTEXT__:

| Expo field | Browser property |
| --- | --- |
| EXPO_PUBLIC_CAI_USER_ID | userId |
| EXPO_PUBLIC_CAI_USER_NAME | userName |
| EXPO_PUBLIC_CAI_LANGUAGE | language |
| EXPO_PUBLIC_CAI_COUNTRY | country |

Only string values are projected. Unsupported property names are discarded and all allowed values are JSON-escaped. Values inside allowed fields are not inspected for token-like content; callers must keep them public. These are hints, not proof of identity.

## WebView-to-native bridge

The only accepted action is:

~~~json
{
  "output_type": "navigation",
  "process": "GotoPage",
  "data": {
    "page_name": "MainPage",
    "case_id": "optional CRM incident id",
    "address_id": "optional consumer address id the main page should open on"
  }
}
~~~

services/navigationAction.ts validates the exact keys and values. components/ChatWebView.tsx emits the resulting typed request. app/(tabs)/chat.tsx immediately replaces with /main-page once per screen lifetime.

MainPage shows the exact nonblank case_id and address_id, or Not provided for whichever is missing, and replaces back to /(tabs)/chat.

## Operating-system URL integration

React Native Linking receives cross-origin HTTP(S), tel, and mailto URLs. Same-origin HTTP(S) remains in the WebView. Invalid input and unsupported schemes are blocked.

External-open failures use fixed warning text and do not expose the requested URL in logs.

## Development stack

The related repository is /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr. Complete-stack, Vite, and live-action smoke require a checkout or deployment of its `feat/native-client-actions` branch at commit `66c88d5` or a merged descendant. In the selected global checkout, verify this before starting services:

~~~bash
git merge-base --is-ancestor 66c88d5 HEAD
~~~

If that command fails, the checkout lacks the native-action producer/dispatcher and is not a valid live-action target. Roll out the global revision first and this native host second.

Create its required local environment files before Compose or Vite:

~~~bash
# Run from the verified global checkout.
cp CAICore/.env.example CAICore/.env
cp WatersMCPServer/.env.example WatersMCPServer/.env
~~~

For direct local credentials, remove or comment the sample KEY_VAULT_URL in CAICore/.env and set NESGEN_ENDPOINT, NESGEN_CLIENT_ID, and NESGEN_CLIENT_SECRET. A real Key Vault with the local-container Azure credentials is the alternative. In WatersMCPServer/.env, confirm WATERS_API_URL and fill WATERS_API_USER, WATERS_API_PASSWORD, WATERS_API_SK, TEMP_CUSTOMER_ID, and TEMP_CONSUMER_CONNECTION_ID. Populated files contain secrets and remain uncommitted.

The Compose workflow is:

~~~bash
# Run from the verified global checkout.
docker compose -f docker-compose.dev.yaml up --build
~~~

The Compose file starts Cosmos, the CRM tool service, and CAICore. The current Erikli config has `auth.enabled: false`. Create WebFrontend/.env.local with VITE_AGENT_KEY=erikli before running the frontend. WEB_ENTRY_POINT_ID=erikli is the alternative selector; configure exactly one. Leave VITE_API_BASE_URL and WEB_API_BASE_URL unset for the same-origin /v1 proxy:

~~~bash
cd WebFrontend
npm ci
npm run dev -- --host 0.0.0.0
~~~

Configure this host with a device-reachable EXPO_PUBLIC_CAI_FRONTEND_URL on Vite port 5174, then use npx expo start --clear. env.sample leaves the optional EXPO_PUBLIC_CAI_API_BASE_URL blank so the WebView uses Vite's same-origin proxy. Android Emulator reaches host ports through 10.0.2.2; a physical device uses the host LAN address. If a direct API override is required, CAICore ALLOWED_ORIGINS must include the WebView's exact frontend scheme, host, and port.

Live-device execution was not completed in the implementation environment; passing native automation does not establish this integration matrix.

## No incoming server integration

This Expo application exposes no server endpoint or webhook. Its inbound boundaries are WebView messages and user interaction.
