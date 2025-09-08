import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AuthService } from "../services/AuthService";

interface CustomerIdModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerIdChanged: (customerId: string, accessToken: string) => void;
}

export const CustomerIdModal: React.FC<CustomerIdModalProps> = ({
  visible,
  onClose,
  onCustomerIdChanged
}) => {
  const [customerId, setCustomerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      loadCurrentCustomerId();
    }
  }, [visible]);

  const loadCurrentCustomerId = async () => {
    try {
      const storedCustomerId = await AuthService.getStoredCustomerId();
      setCurrentCustomerId(storedCustomerId);
      setCustomerId(storedCustomerId || "");
    } catch (error) {
      console.error("Failed to load current customer ID:", error);
    }
  };

  const handleSave = async () => {
    if (!customerId.trim()) {
      Alert.alert("Hata", "Customer ID boş olamaz");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔄 Getting access token for customer:", customerId);

      // Force refresh token for new customer ID
      const accessToken = await AuthService.refreshToken(customerId.trim());

      console.log("✅ Access token obtained successfully");

      // Notify parent component
      onCustomerIdChanged(customerId.trim(), accessToken);

      Alert.alert(
        "Başarılı",
        `Customer ID güncellendi: ${customerId}\nYeni access token alındı.`,
        [{ text: "Tamam", onPress: onClose }]
      );
    } catch (error) {
      console.error("❌ Failed to get access token:", error);
      Alert.alert(
        "Hata",
        `Access token alınamadı:\n${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`,
        [{ text: "Tamam" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCustomerId(currentCustomerId || "");
    onClose();
  };

  const showTokenInfo = async () => {
    try {
      const tokenInfo = await AuthService.getTokenInfo();

      let message = "";
      if (tokenInfo.hasToken) {
        message = `Customer ID: ${tokenInfo.customerId}\n`;
        message += `Token Durumu: ${
          tokenInfo.isExpired ? "Süresi Dolmuş" : "Geçerli"
        }\n`;
        message += `Bitiş Zamanı: ${
          tokenInfo.expiresAt?.toLocaleString("tr-TR") || "Bilinmiyor"
        }`;
      } else {
        message = "Henüz token alınmamış";
      }

      Alert.alert("Token Bilgileri", message);
    } catch (error) {
      Alert.alert("Hata", "Token bilgileri alınamadı");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Customer ID Ayarları</Text>

          {currentCustomerId && (
            <View style={styles.currentInfo}>
              <Text style={styles.currentLabel}>Mevcut Customer ID:</Text>
              <Text style={styles.currentValue}>{currentCustomerId}</Text>
            </View>
          )}

          <Text style={styles.label}>Yeni Customer ID:</Text>
          <TextInput
            style={styles.input}
            value={customerId}
            onChangeText={setCustomerId}
            placeholder="Customer ID giriniz..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.infoButton]}
              onPress={showTokenInfo}
            >
              <Text style={styles.buttonText}>📊 Token Bilgisi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>❌ İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading || !customerId.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>✅ Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            💡 Customer ID değiştirildiğinde yeni access token otomatik alınacak
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modal: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: "90%"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e50914",
    marginBottom: 20,
    textAlign: "center"
  },
  currentInfo: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  currentLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4
  },
  currentValue: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "monospace"
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center"
  },
  infoButton: {
    backgroundColor: "#2196F3"
  },
  cancelButton: {
    backgroundColor: "#666"
  },
  saveButton: {
    backgroundColor: "#e50914"
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  hint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16
  }
});
