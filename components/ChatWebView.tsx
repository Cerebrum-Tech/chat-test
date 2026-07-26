import React, { useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { parseNavigationRequest } from '../services/navigationAction';
import { buildWebViewBootstrap } from '../services/webViewBootstrap';
import { classifyWebViewUrl } from '../services/webViewUrlPolicy';
import type { ChatWebViewProps } from '../types/webview';

export const ChatWebView: React.FC<ChatWebViewProps> = ({
  session,
  onNavigationRequest,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  const frontendUrl = process.env.EXPO_PUBLIC_CAI_FRONTEND_URL?.trim() ?? '';
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

  const handleShouldStartLoadWithRequest = (request: { url?: string }) => {
    const url = request.url ?? '';
    const decision = classifyWebViewUrl(url, frontendUrl);
    if (decision === 'allow') return true;
    if (decision === 'open-external') {
      void Linking.openURL(url).catch(() => {
        console.warn('External URL could not be opened');
      });
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
