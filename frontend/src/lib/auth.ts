const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ログイン・ログアウト・認証失敗時に破棄するセッション固有の localStorage キー
const SESSION_STORAGE_KEYS = ["userListSearchState"] as const;

export function getAccessToken(): string | null {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
	for (const key of SESSION_STORAGE_KEYS) {
		localStorage.removeItem(key);
	}
}

export function clearTokens(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	for (const key of SESSION_STORAGE_KEYS) {
		localStorage.removeItem(key);
	}
}

export function isAuthenticated(): boolean {
	return getAccessToken() !== null;
}
