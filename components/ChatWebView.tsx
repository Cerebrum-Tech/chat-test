import React, { useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { ChatWebViewProps, WebViewMessage } from '../types/webview';

export const ChatWebView: React.FC<ChatWebViewProps> = ({
  onMessage,
  onNavigationRequest,
  style
}) => {
  const webViewRef = useRef<WebView>(null);
  
  // Get environment variables
  const websiteToken = process.env.EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '';
  const userId = process.env.EXPO_PUBLIC_CHATWOOT_USER_ID || '';
  const accessToken = process.env.EXPO_PUBLIC_CHATWOOT_ACCESS_TOKEN || '';
  const customerConnectionId = process.env.EXPO_PUBLIC_CHATWOOT_CUSTOMER_CONNECTION_ID || '';
  const baseUrl = process.env.EXPO_PUBLIC_CHATWOOT_BASE_URL || 'https://chat.footgolflegends.com';

  // Inject ReactNativeWebView before content loads (for external URLs)
  const injectedJavaScriptBeforeContentLoaded = `
    // Ensure ReactNativeWebView is available globally with proper fallback
    if (!window.ReactNativeWebView) {
      window.ReactNativeWebView = {
        postMessage: function(message) {
          console.warn('ReactNativeWebView not yet available, message would be:', message);
        }
      };
    }
    
    // Wait for the actual ReactNativeWebView to be available
    let checkCount = 0;
    const checkForWebView = () => {
      checkCount++;
      if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
        console.log('ReactNativeWebView is ready after', checkCount, 'checks');
        return;
      }
      if (checkCount < 50) { // Try for up to 5 seconds (50 * 100ms)
        setTimeout(checkForWebView, 100);
      } else {
        console.error('ReactNativeWebView failed to initialize after 5 seconds');
      }
    };
    
    checkForWebView();
    true;
  `;

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      
      // Log all incoming messages
      console.log('📥 WebView Message Received:', {
        timestamp: new Date().toISOString(),
        process: message.Process,
        data: message.Data
      });

      // Handle specific message types
      switch (message.Process) {
        case 'GotoPage':
          console.log('🚀 Navigation Request:', message.Data);
          if (onNavigationRequest) {
            onNavigationRequest(message.Data.PageName, message.Data.CaseId);
          }
          break;
        
        case 'ChatMessage':
          console.log('💬 Chat Message:', message.Data);
          // Check if chat message contains navigation action
          const chatMessage = message.Data?.message;
          if (chatMessage?.content_attributes?.navigation_action && onNavigationRequest) {
            console.log('🧭 Navigation found in ChatMessage');
            const navData = chatMessage.content_attributes.navigation_data;
            if (navData?.process === 'GotoPage') {
              const { page_name, case_id } = navData.data;
              // Convert snake_case to PascalCase for screen names
              const screenName = page_name.split('_').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join('');
              onNavigationRequest(screenName.replace('Screen', ''), case_id);
            }
          }
          break;
        
        default:
          console.log('❓ Unknown message type:', message.Process);
      }

      // Call the general message handler if provided
      if (onMessage) {
        onMessage(message);
      }

    } catch (error) {
      console.error('❌ Error parsing WebView message:', error);
      console.error('Raw message:', event.nativeEvent.data);
    }
  };

  // Intercept navigations to open external links in the system browser
  const handleShouldStartLoadWithRequest = (request: any) => {
    try {
      const url: string = request?.url || '';
      if (!url) return true;

      // Always allow internal navigations and non-http(s) schemes needed by the widget
      const isHttp = /^https?:\/\//i.test(url);
      const isDataOrAbout = /^(about:blank|data:|blob:)/i.test(url);
      if (!isHttp || isDataOrAbout) {
        return true;
      }

      // Compare host with the chat base URL host to detect external links
      const extractHost = (u: string) => u.replace(/^https?:\/\//i, '').split('/')[0];
      const baseHost = extractHost(baseUrl);
      const urlHost = extractHost(url);
      const isSameHost = baseHost === urlHost;

      if (!isSameHost) {
        Linking.openURL(url).catch(err => console.error('Failed to open URL externally:', err));
        return false; // Prevent WebView from loading external URL
      }

      return true;
    } catch (e) {
      console.warn('onShouldStartLoadWithRequest guard failed, allowing navigation', e);
      return true;
    }
  };

  // HTML content with the Chatwoot script
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <title>Chatwoot Widget</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #141414;
          color: #ffffff;
          height: 100vh;
          overflow: hidden;
        }
        
        .container {
          height: 100vh;
          width: 100vw;
          position: relative;
        }
        
        /* Netflix-themed loading indicator */
        .loading {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #e50914;
          font-size: 18px;
          z-index: 1000;
        }
        
        .loading::after {
          content: '';
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #e50914;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s ease-in-out infinite;
          margin-left: 10px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading" id="loading">Loading Chat...</div>
      </div>

      <script>
        // Global error handler for catching ReactNativeWebView issues
        window.addEventListener('error', function(event) {
          if (event.error && event.error.message && 
              (event.error.message.includes('ReactNativeWebView') || 
               event.error.message.includes('postMessage'))) {
            console.warn('Caught ReactNativeWebView related error:', event.error.message);
            event.preventDefault(); // Prevent the error from propagating
          }
        });
        
        // Helper function for safe postMessage calls
        function safePostMessage(messageData) {
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
              return true;
            } catch (error) {
              console.error('Error sending message to React Native:', error);
              return false;
            }
          } else {
            console.warn('ReactNativeWebView not available for message:', messageData);
            return false;
          }
        }
        
        // Override console.log to also send logs to React Native
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          safePostMessage({
            Process: 'Log',
            Data: {
              level: 'info',
              message: args.join(' '),
              timestamp: new Date().toISOString()
            }
          });
        };

        window.chatwootSettings = {
          hideMessageBubble: false,
          showUnreadMessagesDialog: false,
          position: "right",
          locale: "en",
          useBrowserLanguage: false,
          type: "standard",
          darkMode: "false"
        };
        
        // CRITICAL: Listen for messages from the Chatwoot widget iframe
        window.addEventListener('message', function(event) {
          // Check if it's a Chatwoot widget message
          if (typeof event.data === 'string' && event.data.startsWith('chatwoot-widget:')) {
            try {
              // Parse the Chatwoot message
              const messageData = JSON.parse(event.data.replace('chatwoot-widget:', ''));
              
              console.log('📨 Received message from Chatwoot iframe:', messageData);
              
              // Check if this is a navigation forward request
              if (messageData.event === 'forwardToReactNative') {
                console.log('🚀 Navigation forward request detected:', messageData);
                
                // Create the React Native message format
                const rnMessage = {
                  Process: messageData.type || 'GotoPage',
                  Data: messageData.data
                };
                
                // Send to React Native
                if (safePostMessage(rnMessage)) {
                  console.log('✅ Navigation message forwarded to React Native:', rnMessage);
                } else {
                  console.error('❌ Failed to forward message to React Native');
                }
              }
            } catch (error) {
              console.error('Error processing Chatwoot message:', error);
            }
          }
        });
        
        /* Example of how to test sending a navigation message from within the Chatwoot widget:
         * In your Chatwoot widget code or browser console:
         * 
         * // Method 1: Using postMessage directly:
         * window.parent.postMessage('chatwoot-widget:' + JSON.stringify({
         *   event: 'forwardToReactNative',
         *   type: 'GotoPage',
         *   data: {
         *     PageName: 'AddressesScreen',
         *     CaseId: 'case-123',
         *     additionalParam: 'value'
         *   }
         * }), '*');
         * 
         * // Method 2: Using helper function in your widget:
         * import { sendNavigationMessage } from 'widget/helpers/actionCable';
         * sendNavigationMessage('AddressesScreen', 'case-123', {
         *   additionalParam: 'value'
         * });
         */
      </script>
      
      <script>
        (function(d, t) {
          var BASE_URL = "${baseUrl}";
          var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
          g.src = BASE_URL + "/packs/js/sdk.js/?rn_test=true";
          g.async = true;
          g.defer = true;
          s.parentNode.insertBefore(g, s);
          g.onload = function() {
            window.chatwootSDK.run({
              websiteToken: "${websiteToken}",
              baseUrl: BASE_URL
            });
          };
        })(document, "script");
      </script>
      
      <script>
        window.addEventListener("chatwoot:ready", function() {
          // Hide loading indicator
          const loading = document.getElementById('loading');
          if (loading) loading.style.display = 'none';
          
          window.$chatwoot.setUser("${userId}", {
            name: "${userId}",
          });
          
          window.$chatwoot.setCustomAttributes({
            access_token: "${accessToken}",
            customer_connection_id: "${customerConnectionId}",
          });
          
          console.log("Chatwoot: visitor identified & custom attributes sent");
          
          setTimeout(() => {
            window.$chatwoot.toggle('open');
            console.log("Chatwoot: chat opened");
            
            setTimeout(() => {
              hideBubblePermanently();
              setTimeout(() => {
                overrideBackButton();
                watchForBackButton(); 
              }, 250);
            }, 250);
            
            window.addEventListener('chatwoot:widget-visible', function(event) {
              hideBubblePermanently();
            });
            
          }, 250); 
          
          function hideBubblePermanently() {
            const existingStyle = document.getElementById('hide-chatwoot-bubble');
            if (!existingStyle) {
              const style = document.createElement('style');
              style.id = 'hide-chatwoot-bubble';
              style.textContent = \`
                .woot-widget-bubble {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  pointer-events: none !important;
                }
              \`;
              document.head.appendChild(style);
            }
            
            const bubbles = document.querySelectorAll('.woot-widget-bubble');
            bubbles.forEach(bubble => {
              bubble.style.display = 'none';
              bubble.style.visibility = 'hidden';
              bubble.style.opacity = '0';
              bubble.style.pointerEvents = 'none';
            });
            
            console.log("Chatwoot: bubble hidden permanently");
          }
    
          function overrideBackButton() {
            console.log('Attempting to find back button...');
            
            const allButtons = document.querySelectorAll('button');
            console.log('Total buttons found:', allButtons.length);
            allButtons.forEach((btn, index) => {
              console.log(\`Button \${index}:\`, btn.className, btn.innerHTML.substring(0, 100));
            });
            
            let backButtonElement = null;
            
            const buttonWithPx2 = document.querySelector('button[class*="px-2"]');
            if (buttonWithPx2) {
              backButtonElement = buttonWithPx2;
              console.log('Back button found using px-2 class strategy');
            }
            
            if (!backButtonElement) {
              const buttonWithNegativeMargin = document.querySelector('button[class*="-ml-"]');
              if (buttonWithNegativeMargin) {
                backButtonElement = buttonWithNegativeMargin;
                console.log('Back button found using negative margin class strategy');
              }
            }
            
            if (!backButtonElement) {
              const svgPath = document.querySelector('path[d*="M15.53 4.22"]');
              if (svgPath) {
                backButtonElement = svgPath.closest('button');
                console.log('Back button found using SVG path strategy');
              }
            }
            
            if (!backButtonElement) {
              const headerSelectors = ['header', '.header', '[class*="header"]', '[class*="Header"]'];
              for (let selector of headerSelectors) {
                const headerElement = document.querySelector(selector);
                if (headerElement) {
                  const firstButton = headerElement.querySelector('button');
                  if (firstButton) {
                    backButtonElement = firstButton;
                    console.log('Back button found using header first button strategy');
                    break;
                  }
                }
              }
            }
            
            if (!backButtonElement) {
              allButtons.forEach((button, index) => {
                const svg = button.querySelector('svg');
                if (svg) {
                  const path = svg.querySelector('path');
                  if (path) {
                    const d = path.getAttribute('d');
                    if (d && (d.includes('15.53') || d.includes('L8.81 12') || d.includes('7.25-7.25'))) {
                      backButtonElement = button;
                      console.log(\`Back button found using arrow SVG search (button \${index})\`);
                      return;
                    }
                  }
                }
              });
            }
            
            if (!backButtonElement && allButtons.length > 0) {
              backButtonElement = allButtons[0];
              console.log('Back button found using first button fallback');
            }
            
            if (backButtonElement) {
              if (!backButtonElement.hasAttribute('data-custom-handler')) {
                backButtonElement.setAttribute('data-custom-handler', 'true');
                
                backButtonElement.addEventListener('click', function(event) {
                  event.preventDefault();
                  event.stopPropagation();
                  event.stopImmediatePropagation();
                  
                  console.log('Back button clicked - executing custom action');
                  
                  // Execute your custom React Native WebView postMessage
                  const message = {
                    Process: 'GotoPage',
                    Data: {
                      PageName: 'AddressesScreen',
                      CaseId: 'xxx'
                    }
                  };
                  
                  // Send navigation message using safe helper
                  if (safePostMessage(message)) {
                    console.log('Navigation message sent to React Native:', message);
                  }
                  
                  return false;
                }, true);
                
                console.log('Back button override applied successfully to:', backButtonElement.className);
              } else {
                console.log('Back button already has custom handler');
              }
            } else {
              console.log('Back button not found with any strategy, retrying in 2 seconds...');
              setTimeout(overrideBackButton, 100);
            }
          }
          
          function watchForBackButton() {
            const observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                      const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
                      if (buttons.length > 0 || node.tagName === 'BUTTON') {
                        console.log('New button(s) detected, trying to override...');
                        setTimeout(overrideBackButton, 100);
                      }
                    }
                  });
                }
              });
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            console.log('MutationObserver started watching for new buttons');
          }
          
          overrideBackButton();
    
        });
        
        window.addEventListener("chatwoot:on-message", function(e) {
          console.log("New message in widget:", e.detail);
          
          // Send message notification to React Native
          safePostMessage({
            Process: 'ChatMessage',
            Data: {
              message: e.detail,
              timestamp: new Date().toISOString()
            }
          });
        });
        
        window.addEventListener("chatwoot:error", function(err) {
          console.error("Chatwoot widget error:", err);
          
          // Send error to React Native
          safePostMessage({
            Process: 'Error',
            Data: {
              error: err.toString(),
              timestamp: new Date().toISOString()
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleWebViewMessage}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={true}
        style={styles.webview}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        setSupportMultipleWindows={false}
        // Additional properties from the example
        thirdPartyCookiesEnabled={true}
        userAgent="YourApp/1.0 (ReactNative)"
        mixedContentMode="compatibility"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
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