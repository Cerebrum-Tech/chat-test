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

The global frontend AuthProvider is the only authentication owner. The native host does not create, store, refresh, or inject a token. Authentication behavior is therefore tested in the frontend and exercised through the device smoke matrix.

## Public user context

The native host may expose four optional properties through window.__CHAT_BACKEND_CONTEXT__:

| Expo field | Browser property |
| --- | --- |
| EXPO_PUBLIC_CAI_USER_ID | userId |
| EXPO_PUBLIC_CAI_USER_NAME | userName |
| EXPO_PUBLIC_CAI_LANGUAGE | language |
| EXPO_PUBLIC_CAI_COUNTRY | country |

Only string values are projected. Unsupported fields are discarded and all values are JSON-escaped. These are public hints, not proof of identity.

## WebView-to-native bridge

The only accepted action is:

~~~json
{
  "output_type": "navigation",
  "process": "GotoPage",
  "data": {
    "page_name": "MainPage",
    "case_id": "optional CRM incident id"
  }
}
~~~

services/navigationAction.ts validates the exact keys and values. components/ChatWebView.tsx emits the resulting typed request. app/(tabs)/chat.tsx immediately replaces with /main-page once per screen lifetime.

MainPage shows the exact nonblank case_id or Not provided and replaces back to /(tabs)/chat.

## Operating-system URL integration

React Native Linking receives cross-origin HTTP(S), tel, and mailto URLs. Same-origin HTTP(S) remains in the WebView. Invalid input and unsupported schemes are blocked.

External-open failures use fixed warning text and do not expose the requested URL in logs.

## Development stack

The related repository is /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr.

Its documented local workflow is:

~~~bash
cd /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr
docker compose -f docker-compose.dev.yaml up --build
~~~

The Compose file starts Cosmos, the CRM tool service, and CAICore. Run the WebFrontend separately:

~~~bash
cd /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr/WebFrontend
npm ci
npm run dev -- --host 0.0.0.0
~~~

Configure this host with device-reachable frontend and API URLs, then use npx expo start --clear. Android Emulator reaches host ports through 10.0.2.2; a physical device uses the host LAN address.

## No incoming server integration

This Expo application exposes no server endpoint or webhook. Its inbound boundaries are WebView messages and user interaction.
