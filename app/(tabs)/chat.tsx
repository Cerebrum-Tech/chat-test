import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ChatWebView } from "../../components/ChatWebView";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { CustomerIdModal } from "../../components/CustomerIdModal";
import { AuthService } from "../../services/AuthService";
import { WebViewMessageHandler } from "../../services/WebViewMessageHandler";
import { WebViewMessage } from "../../types/webview";

export default function ChatScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCustomerIdModal, setShowCustomerIdModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    pageName: string;
    caseId: string;
  } | null>(null);

  // Dynamic auth states
  const [currentCustomerId, setCurrentCustomerId] = useState<string>("");
  const [currentAccessToken, setCurrentAccessToken] = useState<string>("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const messageHandler = useRef(new WebViewMessageHandler()).current;

  const loadInitialAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      // Get default customer ID from env or use fallback
      const defaultCustomerId =
        process.env.EXPO_PUBLIC_CHATWOOT_CUSTOMER_CONNECTION_ID ||
        "01391bfb-e4cc-eb11-9c21-005056b20185";

      console.log("🔄 Loading initial auth for customer:", defaultCustomerId);

      // Get access token for default customer
      const accessToken = await AuthService.getAccessToken(defaultCustomerId);

      setCurrentCustomerId(defaultCustomerId);
      setCurrentAccessToken(accessToken);

      console.log("✅ Initial auth loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load initial auth:", error);
      Alert.alert(
        "Authentication Error",
        `Failed to get access token:\n${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        [{ text: "Retry", onPress: loadInitialAuth }, { text: "Cancel" }]
      );
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Load initial auth data on component mount
  useEffect(() => {
    loadInitialAuth();
  }, [loadInitialAuth]);

  const handleCustomerIdChanged = (customerId: string, accessToken: string) => {
    console.log("🔄 Customer ID changed:", customerId);
    setCurrentCustomerId(customerId);
    setCurrentAccessToken(accessToken);

    // Reset WebView to use new auth
    resetWebView();
  };

  const handleWebViewMessage = (message: WebViewMessage) => {
    messageHandler.handleMessage(message, {
      onGotoPage: (pageName: string, caseId: string) => {
        setPendingNavigation({ pageName, caseId });
        setShowConfirmModal(true);
      },
      onChatMessage: (messageData: any) => {
        console.log("New chat message received:", messageData);
      },
      onLog: (logData: any) => {
        console.log("WebView log:", logData);
      },
      onError: handleWebViewError,
      onUnknown: (unknownMessage: WebViewMessage) => {
        console.log("Unknown message type:", unknownMessage);
      }
    });
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      console.log(
        `Navigating to ${pendingNavigation.pageName} with case ${pendingNavigation.caseId}`
      );
      // Here you would implement your actual navigation logic
    }
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const getMessageHistory = () => {
    const history = messageHandler.getMessageHistory();
    const historyText = history
      .slice(-10) // Show last 10 messages
      .map(
        (msg, index) =>
          `${index + 1}. [${msg.timestamp}] ${msg.process}: ${JSON.stringify(
            msg.data
          ).substring(0, 100)}...`
      )
      .join("\n");

    Alert.alert(
      "📋 Message History (Last 10)",
      historyText || "No messages yet",
      [{ text: "OK" }]
    );
  };

  const clearHistory = () => {
    messageHandler.clearMessageHistory();
    Alert.alert("✅ History Cleared", "Message history has been cleared");
  };

  const toggleWebView = () => {
    setIsVisible(!isVisible);
  };

  const resetWebView = useCallback(() => {
    console.log("🔄 Resetting WebView from chat screen...");

    // First hide the WebView
    setIsVisible(false);

    // Clear message history
    messageHandler.clearMessageHistory();

    // Update key to force complete re-render
    setWebViewKey((prev) => prev + 1);

    // Show WebView again after a short delay
    setTimeout(() => {
      setIsVisible(true);
      console.log("✅ WebView reset completed");
    }, 100);
  }, [messageHandler]);

  const handleWebViewError = useCallback(
    (errorData: any) => {
      console.error("WebView Error:", errorData);
      Alert.alert(
        "WebView Error",
        errorData.error || "An error occurred with the chat widget",
        [
          { text: "OK", style: "default" },
          { text: "Reset", style: "destructive", onPress: resetWebView }
        ]
      );
    },
    [resetWebView]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {isLoadingAuth ? (
          <Text style={styles.authStatus}>🔄 Loading authentication...</Text>
        ) : (
          <View style={styles.authInfo}>
            <Text style={styles.authLabel}>Customer ID:</Text>
            <Text style={styles.authValue}>{currentCustomerId}</Text>
            <Text style={styles.authLabel}>Token:</Text>
            <Text style={styles.authValue}>
              {currentAccessToken ? "✅ Active" : "❌ Missing"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={toggleWebView}
        >
          <Text style={styles.buttonText}>
            {isVisible ? "👁️ Hide" : "👁️ Show"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={getMessageHistory}
        >
          <Text style={styles.buttonText}>📋 History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearHistory}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={resetWebView}
        >
          <Text style={styles.buttonText}>🔄 Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.customerButton]}
          onPress={() => setShowCustomerIdModal(true)}
        >
          <Text style={styles.buttonText}>👤 Customer</Text>
        </TouchableOpacity>
      </View>

      {isVisible && !isLoadingAuth && (
        <View style={styles.webviewContainer}>
          <ChatWebView
            key={webViewKey}
            onMessage={handleWebViewMessage}
            style={styles.webview}
            customerId={currentCustomerId}
            accessToken={currentAccessToken}
          />
        </View>
      )}

      <ConfirmationModal
        visible={showConfirmModal}
        title="🚀 Navigation Request"
        message={
          pendingNavigation
            ? `Navigate to: ${pendingNavigation.pageName}\nCase ID: ${pendingNavigation.caseId}`
            : ""
        }
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        confirmText="Navigate"
        cancelText="Cancel"
      />

      <CustomerIdModal
        visible={showCustomerIdModal}
        onClose={() => setShowCustomerIdModal(false)}
        onCustomerIdChanged={handleCustomerIdChanged}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414" // Netflix theme
  },
  header: {
    padding: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e50914", // Netflix red
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: "#999"
  },
  controls: {
    flexDirection: "row",
    padding: 10,
    gap: 6,
    flexWrap: "nowrap",
    justifyContent: "center"
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#e50914"
  },
  secondaryButton: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#666"
  },
  dangerButton: {
    backgroundColor: "#d32f2f"
  },
  warningButton: {
    backgroundColor: "#ff9800"
  },
  customerButton: {
    backgroundColor: "#9c27b0"
  },
  buttonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  },

  webviewContainer: {
    flex: 1,
    backgroundColor: "#000"
  },
  webview: {
    flex: 1
  },

  authStatus: {
    fontSize: 12,
    color: "#ff9800",
    textAlign: "center",
    marginTop: 8
  },
  authInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#222",
    borderRadius: 4
  },
  authLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2
  },
  authValue: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "monospace",
    marginBottom: 4
  }
});
