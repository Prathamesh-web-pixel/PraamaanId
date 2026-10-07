/**
 * Client API Service Layer
 * Interfaces securely with backend Express endpoints.
 * Never stores or transmits secrets; supports credentials & token authorization.
 */

import {
  User,
  VerificationRecord,
  AuditLogEntry,
  SecurityReport,
  FaceVerificationResult,
  Booking,
  BookingStatus,
  BookingPriority,
  ServiceType
} from '../types';

let sessionToken: string | null = null;

export function setClientToken(token: string | null) {
  sessionToken = token;
}

export function getClientToken(): string | null {
  return sessionToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // Sends HttpOnly session cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setClientToken(res.token);
    return res;
  },

  async register(email: string, fullName: string, password: string): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, password })
    });
  },

  async logout(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST' });
    setClientToken(null);
  },

  async getMe(): Promise<{ authenticated: boolean; user?: User }> {
    return request<{ authenticated: boolean; user?: User }>('/api/auth/me');
  },

  // Document Verification
  async uploadAndAnalyzeDocument(params: {
    imageBase64: string;
    mimeType: string;
    declaredType?: string;
    maskPII: boolean;
  }): Promise<{ message: string; record: VerificationRecord }> {
    return request<{ message: string; record: VerificationRecord }>('/api/documents/upload-and-analyze', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },


  async checkIdentityConsistency(verificationIds: string[]): Promise<{ message: string; result: {
    score: number;
    verdict: 'CONSISTENT' | 'REVIEW' | 'CONFLICT';
    documentsChecked: number;
    matchedFields: string[];
    conflicts: Array<{ field: string; documents: string[]; values: string[] }>;
    reasons: string[];
  } }> {
    return request('/api/identity/consistency', {
      method: 'POST',
      body: JSON.stringify({ verificationIds })
    });
  },

  async verifyFace(params: {
    documentImageBase64: string;
    selfieImageBase64: string;
    verificationId?: string;
    challengeFrames?: number;
  }): Promise<{ message: string; result: FaceVerificationResult }> {
    return request<{ message: string; result: FaceVerificationResult }>('/api/face/verify', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getVerifications(filters?: {
    status?: string;
    riskLevel?: string;
    documentType?: string;
  }): Promise<{ records: VerificationRecord[] }> {
    const searchParams = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') searchParams.set('status', filters.status);
    if (filters?.riskLevel && filters.riskLevel !== 'ALL') searchParams.set('riskLevel', filters.riskLevel);
    if (filters?.documentType && filters.documentType !== 'ALL') searchParams.set('documentType', filters.documentType);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ records: VerificationRecord[] }>(`/api/verifications${query}`);
  },

  async getVerificationById(id: string): Promise<{ record: VerificationRecord }> {
    return request<{ record: VerificationRecord }>(`/api/verifications/${id}`);
  },

  async getPublicVerification(id: string): Promise<{ verification: {
    id: string;
    status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED_TAMPERED' | 'REJECTED';
    documentType: string;
    maskedDocumentNumber: string;
    trustScore: number;
    riskLevel: string;
    verifiedAt: string;
    cryptographicSeal: string;
  } }> {
    return request(`/api/public/verify/${encodeURIComponent(id)}`);
  },

  async submitVerificationDecision(
    id: string,
    verdict: 'VERIFIED' | 'REJECTED' | 'FLAGGED_TAMPERED',
    remarks: string
  ): Promise<{ message: string; record: VerificationRecord }> {
    return request<{ message: string; record: VerificationRecord }>(`/api/verifications/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ verdict, remarks })
    });
  },

  // Admin & Audit
  async getAdminUsers(): Promise<{ users: User[] }> {
    return request<{ users: User[] }>('/api/admin/users');
  },

  async updateUserRole(userId: string, role: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  async toggleUserStatus(userId: string): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH'
    });
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Booking & Appointment Management
  async getBookings(filters?: {
    status?: string;
    serviceType?: string;
    search?: string;
  }): Promise<{ bookings: Booking[] }> {
    const searchParams = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') searchParams.set('status', filters.status);
    if (filters?.serviceType && filters.serviceType !== 'ALL') searchParams.set('serviceType', filters.serviceType);
    if (filters?.search) searchParams.set('search', filters.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ bookings: Booking[] }>(`/api/admin/bookings${query}`);
  },

  async createBooking(data: {
    citizenName: string;
    citizenEmail: string;
    citizenPhone: string;
    serviceType: ServiceType;
    bookingDate: string;
    timeSlot: string;
    verificationCenter: string;
    priority?: BookingPriority;
    notes?: string;
  }): Promise<{ message: string; booking: Booking }> {
    return request<{ message: string; booking: Booking }>('/api/admin/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateBooking(
    id: string,
    updates: {
      status?: BookingStatus;
      priority?: BookingPriority;
      notes?: string;
      bookingDate?: string;
      timeSlot?: string;
      verificationCenter?: string;
    }
  ): Promise<{ message: string; booking: Booking }> {
    return request<{ message: string; booking: Booking }>(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteBooking(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/bookings/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleUserStatus(userId: string): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH'
    });
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Admin Booking Management
  async getBookings(filters?: {
    status?: string;
    serviceType?: string;
    search?: string;
  }): Promise<{ bookings: Booking[] }> {
    const searchParams = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') searchParams.set('status', filters.status);
    if (filters?.serviceType && filters.serviceType !== 'ALL') searchParams.set('serviceType', filters.serviceType);
    if (filters?.search) searchParams.set('search', filters.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ bookings: Booking[] }>(`/api/admin/bookings${query}`);
  },

  async createBooking(data: {
    citizenName: string;
    citizenEmail: string;
    citizenPhone: string;
    serviceType: ServiceType;
    bookingDate: string;
    timeSlot: string;
    verificationCenter: string;
    priority?: BookingPriority;
    notes?: string;
  }): Promise<{ message: string; booking: Booking }> {
    return request<{ message: string; booking: Booking }>('/api/admin/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateBooking(
    id: string,
    updates: {
      status?: BookingStatus;
      priority?: BookingPriority;
      notes?: string;
      bookingDate?: string;
      timeSlot?: string;
      verificationCenter?: string;
    }
  ): Promise<{ message: string; booking: Booking }> {
    return request<{ message: string; booking: Booking }>(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteBooking(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/bookings/${id}`, {
      method: 'DELETE'
    });
  },

  async getAuditLogs(filters?: {
    action?: string;
    role?: string;
    status?: string;
    limit?: number;
  }): Promise<{ logs: AuditLogEntry[] }> {
    const searchParams = new URLSearchParams();
    if (filters?.action && filters.action !== 'ALL') searchParams.set('action', filters.action);
    if (filters?.role && filters.role !== 'ALL') searchParams.set('role', filters.role);
    if (filters?.status && filters.status !== 'ALL') searchParams.set('status', filters.status);
    if (filters?.limit) searchParams.set('limit', filters.limit.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ logs: AuditLogEntry[] }>(`/api/admin/audit${query}`);
  },

  async purgeRetention(): Promise<{ message: string; purgedCount: number }> {
    return request<{ message: string; purgedCount: number }>('/api/admin/purge-retention', {
      method: 'POST'
    });
  },

  async getSecurityAuditReport(): Promise<SecurityReport> {
    return request<SecurityReport>('/api/security/audit-report');
  }
};
