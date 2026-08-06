import React, { useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { dialUrlCandidates } from '../services/dialUrl';
import { parseNavigationRequest } from '../services/navigationAction';
import { buildWebViewBootstrap } from '../services/webViewBootstrap';
import { classifyWebViewUrl, parseAdditionalOrigins } from '../services/webViewUrlPolicy';
import type { ChatWebViewProps } from '../types/webview';

/**
 * Whether the platform actually opened the URL.
 *
 * `Linking.openURL` is typed `Promise<void>`, but both platform modules resolve a boolean
 * and iOS resolves FALSE — rather than rejecting — when it declined to open the URL.
 * RCTLinkingManager does that for every `tel:` URL on the Simulator, which has no Phone
 * app. Treating only a rejection as failure is why a declined dial was silent: no call,
 * no warning, nothing to debug from.
 *
 * A resolved `undefined` counts as success, so a platform that reports nothing is not
 * mistaken for a refusal.
 */
const openedSuccessfully = async (url: string): Promise<boolean> => {
  try {
    const result = (await Linking.openURL(url)) as boolean | void;
    return result !== false;
  } catch {
    return false;
  }
};

export const ChatWebView: React.FC<ChatWebViewProps> = ({
  session,
  onNavigationRequest,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  const frontendUrl = process.env.EXPO_PUBLIC_CAI_FRONTEND_URL?.trim() ?? '';
  // The frontend may forward to another host that serves the same chat. That hop is
  // cross-origin, so the target must be listed or the WebView sends it to the system
  // browser and the session is lost.
  const additionalOrigins = parseAdditionalOrigins(
    process.env.EXPO_PUBLIC_CAI_ALLOWED_ORIGINS,
  );
  // Identity comes from the verified session, not from configuration: the backend derives
  // the CRM customer from the token itself, so a stale EXPO_PUBLIC_CAI_USER_ID would only
  // describe a different user than the one actually signed in. Locale stays configurable
  // because the widget falls back to the device locale when it is absent.
  const injectedJavaScriptBeforeContentLoaded = buildWebViewBootstrap({
    apiBaseUrl: process.env.EXPO_PUBLIC_CAI_API_BASE_URL,
    context: {
      userId: session.consumerId,
      userName: session.label,
      language: process.env.EXPO_PUBLIC_CAI_LANGUAGE || undefined,
      country: process.env.EXPO_PUBLIC_CAI_COUNTRY || undefined,
      token: session.token,
    },
  });

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    const request = parseNavigationRequest(event.nativeEvent.data);
    if (request) onNavigationRequest?.(request);
  };

  // Try each candidate in turn and stop at the first the platform accepts. For a plain
  // http(s) or mailto target that is a single attempt, unchanged; for the customer-service
  // number it is the authored URL then the bare number (see services/dialUrl).
  const openExternally = async (url: string): Promise<void> => {
    for (const candidate of dialUrlCandidates(url)) {
      if (await openedSuccessfully(candidate)) return;
    }
    console.warn('External URL could not be opened');
  };

  const handleShouldStartLoadWithRequest = (request: { url?: string }) => {
    const url = request.url ?? '';
    const decision = classifyWebViewUrl(url, frontendUrl, additionalOrigins);
    if (decision === 'allow') return true;
    if (decision === 'open-external') {
      // Deliberately not awaited: the WebView needs its verdict synchronously, and the
      // verdict is 'false' either way — the navigation never happens inside the WebView.
      void openExternally(url);
    }
    return false;
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ uri: frontendUrl }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        startInLoadingState={true}
        bounces={false}
        scrollEnabled={true}
        setSupportMultipleWindows={false}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="compatibility"
        style={styles.webview}
        onError={() => console.warn('WebView load failed')}
        onHttpError={() => console.warn('WebView HTTP request failed')}
        onLoadStart={() => {
          console.log('🔄 WebView loading started');
        }}
        onLoadEnd={() => {
          console.log('✅ WebView loading completed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414', // Netflix dark background
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
