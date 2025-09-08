import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthResponse {
  access_token: string;
  expires_in?: number;
}

interface StoredToken {
  access_token: string;
  expires_at: number;
  customer_id: string;
}

export class AuthService {
  private static readonly API_URL =
    "https://api.ceremeet.com/api/auth/watersLogin";
  private static readonly BEARER_TOKEN =
    "2aKeE1kpPwFORsuht2Ohrd56364463CsIamd00kqPrw41zR9FfLq73466VqJQQJ99AKACfhMk5XJ3w3AAABACOGiUEu";
  private static readonly STORAGE_KEY = "chatwoot_auth_data";
  private static readonly TOKEN_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Get access token for customer ID
   * First checks storage, then fetches from API if needed
   */
  static async getAccessToken(customerId: string): Promise<string> {
    try {
      console.log("🔑 Getting access token for customer:", customerId);

      // Check if we have a valid stored token
      const storedToken = await this.getStoredToken();
      if (storedToken && this.isTokenValid(storedToken, customerId)) {
        console.log("✅ Using stored access token");
        return storedToken.access_token;
      }

      // Fetch new token from API
      console.log("🌐 Fetching new access token from API...");
      const newToken = await this.fetchAccessToken(customerId);

      // Store the new token
      await this.storeToken(newToken, customerId);

      console.log("✅ New access token obtained and stored");
      return newToken;
    } catch (error) {
      console.error("❌ Failed to get access token:", error);
      throw new Error(
        `Failed to get access token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Fetch access token from API
   */
  private static async fetchAccessToken(customerId: string): Promise<string> {
    const response = await fetch(this.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.BEARER_TOKEN}`
      },
      body: JSON.stringify({
        customer_id: customerId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: AuthResponse = await response.json();

    if (!data.access_token) {
      throw new Error("No access token in API response");
    }

    return data.access_token;
  }

  /**
   * Store token in AsyncStorage
   */
  private static async storeToken(
    accessToken: string,
    customerId: string
  ): Promise<void> {
    const tokenData: StoredToken = {
      access_token: accessToken,
      expires_at: Date.now() + this.TOKEN_DURATION,
      customer_id: customerId
    };

    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
    console.log("💾 Token stored successfully");
  }

  /**
   * Get stored token from AsyncStorage
   */
  private static async getStoredToken(): Promise<StoredToken | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!storedData) {
        return null;
      }

      return JSON.parse(storedData) as StoredToken;
    } catch (error) {
      console.warn("⚠️ Failed to parse stored token:", error);
      return null;
    }
  }

  /**
   * Check if stored token is valid
   */
  private static isTokenValid(
    storedToken: StoredToken,
    currentCustomerId: string
  ): boolean {
    const now = Date.now();

    // Check if token is expired
    if (now >= storedToken.expires_at) {
      console.log("⏰ Stored token is expired");
      return false;
    }

    // Check if customer ID matches
    if (storedToken.customer_id !== currentCustomerId) {
      console.log("👤 Customer ID changed, need new token");
      return false;
    }

    console.log("✅ Stored token is valid");
    return true;
  }

  /**
   * Clear stored token (for logout or testing)
   */
  static async clearStoredToken(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    console.log("🗑️ Stored token cleared");
  }

  /**
   * Get stored customer ID
   */
  static async getStoredCustomerId(): Promise<string | null> {
    const storedToken = await this.getStoredToken();
    return storedToken?.customer_id || null;
  }

  /**
   * Force refresh token (for testing)
   */
  static async refreshToken(customerId: string): Promise<string> {
    console.log("🔄 Force refreshing token...");
    await this.clearStoredToken();
    return await this.getAccessToken(customerId);
  }

  /**
   * Get token info for debugging
   */
  static async getTokenInfo(): Promise<{
    hasToken: boolean;
    customerId: string | null;
    expiresAt: Date | null;
    isExpired: boolean;
  }> {
    const storedToken = await this.getStoredToken();

    if (!storedToken) {
      return {
        hasToken: false,
        customerId: null,
        expiresAt: null,
        isExpired: false
      };
    }

    return {
      hasToken: true,
      customerId: storedToken.customer_id,
      expiresAt: new Date(storedToken.expires_at),
      isExpired: Date.now() >= storedToken.expires_at
    };
  }
}
