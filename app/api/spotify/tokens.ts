interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class TokenStore {
  private static instance: TokenStore;
  private tokens: SpotifyTokens = {
    access_token: '',
    refresh_token: '',
    expires_at: 0
  };

  private constructor() {}

  public static getInstance(): TokenStore {
    if (!TokenStore.instance) {
      TokenStore.instance = new TokenStore();
    }
    return TokenStore.instance;
  }

  public setTokens(tokens: SpotifyTokens) {
    this.tokens = tokens;
  }

  public getTokens(): SpotifyTokens {
    return this.tokens;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.tokens.access_token);
  }

  public clear() {
    this.tokens = {
      access_token: '',
      refresh_token: '',
      expires_at: 0
    };
  }
}

export const tokenStore = TokenStore.getInstance(); 