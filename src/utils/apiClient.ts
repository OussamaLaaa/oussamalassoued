/**
 * API Client for Site Configuration
 * Handles communication with the backend API
 */

import { type SiteConfig } from '../config/siteConfig';
import { API_BASE_URL, DASHBOARD_PASSWORD } from '../config/runtimeConfig';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  lastUpdated?: number;
  version?: string;
  authenticated?: boolean;
}

export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  error?: string;
}

/**
 * Fetch site configuration from API
 */
export async function fetchSiteConfig(): Promise<ApiResponse<SiteConfig>> {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching site config from API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch configuration',
    };
  }
}

/**
 * Update site configuration via API
 */
export async function updateSiteConfig(config: SiteConfig): Promise<ApiResponse<SiteConfig>> {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating site config via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration',
    };
  }
}

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'GET',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkDashboardAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const data = (await response.json()) as AuthResponse;
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function loginToDashboard(password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    const data = (await response.json()) as AuthResponse;
    if (!response.ok) {
      return { success: false, authenticated: false, error: data.error || 'Authentication failed' };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

export async function logoutFromDashboard(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = (await response.json()) as AuthResponse;
    if (!response.ok) {
      return { success: false, authenticated: false, error: data.error || 'Logout failed' };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}