import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { ChatWebViewProps, WebViewMessage } from '../types/webview';

export const ChatWebView: React.FC<ChatWebViewProps> = ({
  onMessage,
  onNavigationRequest,
  style
}) => {
  const webViewRef = useRef<WebView>(null);

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
        // Override console.log to also send logs to React Native
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                Process: 'Log',
                Data: {
                  level: 'info',
                  message: args.join(' '),
                  timestamp: new Date().toISOString()
                }
              }));
            }
          } catch (e) {
            // Ignore errors in logging
          }
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
      </script>
      
      <script>
        (function(d, t) {
          var BASE_URL = "https://chat.footgolflegends.com";
          var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
          g.src = BASE_URL + "/packs/js/sdk.js/?rn_test=true";
          g.async = true;
          g.defer = true;
          s.parentNode.insertBefore(g, s);
          g.onload = function() {
            window.chatwootSDK.run({
              websiteToken: "***REMOVED***",
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
          
          window.$chatwoot.setUser("***REMOVED***", {
            name: "***REMOVED***",
          });
          
          window.$chatwoot.setCustomAttributes({
            access_token: "***REMOVED***",
            customer_connection_id: "***REMOVED***",
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
              }, 500);
            }, 1000);
            
            window.addEventListener('chatwoot:widget-visible', function(event) {
              hideBubblePermanently();
            });
            
          }, 500); 
          
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
                  const message = JSON.stringify({
                    Process: 'GotoPage',
                    Data: {
                      PageName: 'AddressesScreen',
                      CaseId: 'xxx'
                    }
                  });
                  
                  // Check if React Native WebView is available
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(message);
                    console.log('Message sent to React Native:', message);
                  } else {
                    console.warn('ReactNativeWebView not available. Message would be:', message);
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
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              Process: 'ChatMessage',
              Data: {
                message: e.detail,
                timestamp: new Date().toISOString()
              }
            }));
          }
        });
        
        window.addEventListener("chatwoot:error", function(err) {
          console.error("Chatwoot widget error:", err);
          
          // Send error to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              Process: 'Error',
              Data: {
                error: err.toString(),
                timestamp: new Date().toISOString()
              }
            }));
          }
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
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={true}
        style={styles.webview}
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