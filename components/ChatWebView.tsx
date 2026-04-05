import React, { useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { ChatWebViewProps, WebViewMessage } from '../types/webview';

export const ChatWebView: React.FC<ChatWebViewProps> = ({
  onMessage,
  onNavigationRequest,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  const watersUrl = process.env.EXPO_PUBLIC_WATERS_BOT_URL || '';
  const accessToken = process.env.EXPO_PUBLIC_WATERS_ACCESS_TOKEN || '';
  const userId = process.env.EXPO_PUBLIC_WATERS_USER_ID || '';
  const language = process.env.EXPO_PUBLIC_WATERS_LANGUAGE || '';

  const injectedJavaScriptBeforeContentLoaded = `
    window.__CHAT_BACKEND_AUTH__ = ${JSON.stringify({
      type: 'ceremeet',
      token: accessToken,
    })};
    window.__CHAT_BACKEND_CONTEXT__ = ${JSON.stringify({
      userId: userId || undefined,
      language: language || undefined,
    })};
    true;
  `;

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('📥 WebView message:', {
        timestamp: new Date().toISOString(),
        process: message.Process,
      });
      if (message.Process === 'GotoPage' && onNavigationRequest) {
        console.log('🚀 Navigation request:', {
          pageName: message.Data.PageName,
          caseId: message.Data.CaseId,
        });
        onNavigationRequest(message.Data.PageName, message.Data.CaseId);
      }
      if (onMessage) {
        onMessage(message);
      }
    } catch (error) {
      console.error('❌ Error parsing WebView message:', error);
    }
  };

  // Intercept navigations to open external links in the system browser
  const handleShouldStartLoadWithRequest = (request: any) => {
    try {
      const url: string = request?.url || '';
      if (!url) return true;
      const isHttp = /^https?:\/\//i.test(url);
      const isDataOrAbout = /^(about:blank|data:|blob:)/i.test(url);
      if (!isHttp || isDataOrAbout) return true;
      const extractHost = (u: string) => u.replace(/^https?:\/\//i, '').split('/')[0];
      const baseHost = extractHost(watersUrl);
      const urlHost = extractHost(url);
      if (baseHost !== urlHost) {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
        return false;
      }
      return true;
    } catch (e) {
      console.warn('onShouldStartLoadWithRequest guard failed, allowing navigation', e);
      return true;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ uri: watersUrl }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        bounces={false}
        scrollEnabled={true}
        setSupportMultipleWindows={false}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="compatibility"
        style={styles.webview}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView HTTP error:', nativeEvent);
        }}
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
