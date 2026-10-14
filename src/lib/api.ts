import type {
  Appointment,
  BillingPackage,
  Clinic,
  ClinicBilling,
  ClinicDoctorDetail,
  ClinicPayment,
  ClinicSubscription,
  DashboardStats,
  Doctor,
  DoctorAvailability,
  DoctorSubscription,
  LedgerEntry,
  LedgerListResponse,
  MarketingSubscription,
  Paginated,
  Patient,
  PatientDetail,
  PurchaseRequest,
  Speciality,
  SuperadminDashboard,
  UserInfo,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "telemed_access";
const REFRESH_KEY = "telemed_refresh";
const USER_KEY = "telemed_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setAuth(access: string, refresh: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  if (text && (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html"))) {
    throw new Error(
      `API returned HTML instead of JSON (${res.status}). Check NEXT_PUBLIC_API_URL and backend.`,
    );
  }
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail =
      data?.detail ||
      (typeof data === "object" ? JSON.stringify(data) : "Request failed");
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

export function homePathForRole(role: string): string {
  if (role === "superadmin") return "/superadmin/dashboard";
  if (role === "clinic_admin") return "/clinic/packages";
  if (role === "admin") return "/admin/dashboard";
  return "/login";
}

export async function login(username: string, password: string) {
  const data = await request<{
    access: string;
    refresh: string;
    user: UserInfo;
  }>(
    "/api/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    false,
  );
  const allowed = ["admin", "superadmin", "clinic_admin"];
  if (!allowed.includes(data.user.role)) {
    throw new Error("This portal is for admin, superadmin, or clinic admin users.");
  }
  setAuth(data.access, data.refresh, data.user);
  return data;
}

export const api = {
  dashboard: () => request<DashboardStats>("/api/admin/dashboard/"),
  specialities: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Speciality> | Speciality[]>(
      `/api/admin/specialities/${qs ? `?${qs}` : ""}`,
    );
  },
  createSpeciality: (payload: { name: string; icon_url?: string; is_active?: boolean }) =>
    request<Speciality>("/api/admin/specialities/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSpeciality: (
    id: number,
    payload: Partial<{ name: string; icon_url: string; is_active: boolean }>,
  ) =>
    request<Speciality>(`/api/admin/specialities/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSpeciality: (id: number) =>
    request<void>(`/api/admin/specialities/${id}/`, { method: "DELETE" }),
  clinics: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Clinic> | Clinic[]>(
      `/api/admin/clinics/${qs ? `?${qs}` : ""}`,
    );
  },
  createClinic: (payload: {
    name: string;
    address: string;
    city?: string;
    area?: string;
    phone?: string;
    latitude: number | string;
    longitude: number | string;
    is_active?: boolean;
  }) =>
    request<Clinic>("/api/admin/clinics/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateClinic: (
    id: number,
    payload: Partial<{
      name: string;
      address: string;
      city: string;
      area: string;
      phone: string;
      latitude: number | string;
      longitude: number | string;
      is_active: boolean;
    }>,
  ) =>
    request<Clinic>(`/api/admin/clinics/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteClinic: (id: number) =>
    request<void>(`/api/admin/clinics/${id}/`, { method: "DELETE" }),
  doctors: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Doctor> | Doctor[]>(
      `/api/admin/doctors/${qs ? `?${qs}` : ""}`,
    );
  },
  onboardDoctor: (payload: {
    first_name: string;
    last_name: string;
    speciality_ids: number[];
    session_time: number;
    email: string;
    password: string;
  }) =>
    request<Doctor>("/api/admin/doctors/onboarding/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDoctor: (
    uuid: string,
    payload: Partial<{
      first_name: string;
      last_name: string;
      speciality_ids: number[];
      session_time: number;
      is_active: boolean;
      clinic: number | null;
    }>,
  ) =>
    request<Doctor>(`/api/admin/doctors/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteDoctor: (uuid: string) =>
    request<void>(`/api/admin/doctors/${uuid}/`, { method: "DELETE" }),
  doctor: (uuid: string) => request<Doctor>(`/api/admin/doctors/${uuid}/`),
  doctorAvailability: (uuid: string) =>
    request<Paginated<DoctorAvailability> | DoctorAvailability[]>(
      `/api/admin/doctors/${uuid}/availability/`,
    ),
  patients: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Patient> | Patient[]>(
      `/api/admin/patients/${qs ? `?${qs}` : ""}`,
    );
  },
  patient: (uuid: string) => request<PatientDetail>(`/api/admin/patients/${uuid}/`),
  deletePatient: (uuid: string) =>
    request<void>(`/api/admin/patients/${uuid}/`, { method: "DELETE" }),
  appointments: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Appointment> | Appointment[]>(
      `/api/admin/appointments/${qs ? `?${qs}` : ""}`,
    );
  },
  appointment: (id: number | string) =>
    request<Appointment>(`/api/admin/appointments/${id}/`),
  updateAppointment: (id: number, payload: Partial<{ status: string; notes: string }>) =>
    request<Appointment>(`/api/admin/appointments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAppointment: (id: number) =>
    request<void>(`/api/admin/appointments/${id}/`, { method: "DELETE" }),
  subscriptions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<DoctorSubscription> | DoctorSubscription[]>(
      `/api/admin/subscriptions/${qs ? `?${qs}` : ""}`,
    );
  },
  createSubscription: (payload: {
    doctor: number;
    amount: number | string;
    start_date: string;
    end_date: string;
    payment_method?: "cash";
    is_active?: boolean;
    notes?: string;
  }) =>
    request<DoctorSubscription>("/api/admin/subscriptions/", {
      method: "POST",
      body: JSON.stringify({ payment_method: "cash", ...payload }),
    }),
  updateSubscription: (
    uuid: string,
    payload: Partial<{
      amount: number | string;
      start_date: string;
      end_date: string;
      is_active: boolean;
      notes: string;
      payment_method: "cash";
    }>,
  ) =>
    request<DoctorSubscription>(`/api/admin/subscriptions/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSubscription: (uuid: string) =>
    request<void>(`/api/admin/subscriptions/${uuid}/`, { method: "DELETE" }),
  deactivateUnsubscribedDoctors: () =>
    request<{ deactivated_count: number; doctor_ids: number[] }>(
      "/api/admin/subscriptions/deactivate-unsubscribed/",
      { method: "POST" },
    ),

  marketingSubscriptions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<MarketingSubscription> | MarketingSubscription[]>(
      `/api/admin/marketing/subscriptions/${qs ? `?${qs}` : ""}`,
    );
  },
  createMarketingSubscription: (payload: {
    doctor: number;
    amount: number | string;
    start_date: string;
    end_date: string;
    payment_method?: "cash";
    is_active?: boolean;
    notes?: string;
  }) =>
    request<MarketingSubscription>("/api/admin/marketing/subscriptions/", {
      method: "POST",
      body: JSON.stringify({ payment_method: "cash", ...payload }),
    }),
  updateMarketingSubscription: (
    uuid: string,
    payload: Partial<{
      amount: number | string;
      start_date: string;
      end_date: string;
      is_active: boolean;
      notes: string;
      payment_method: "cash";
    }>,
  ) =>
    request<MarketingSubscription>(`/api/admin/marketing/subscriptions/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteMarketingSubscription: (uuid: string) =>
    request<void>(`/api/admin/marketing/subscriptions/${uuid}/`, {
      method: "DELETE",
    }),

  // Superadmin billing
  superDashboard: () => request<SuperadminDashboard>("/api/superadmin/dashboard/"),
  packages: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<BillingPackage> | BillingPackage[]>(
      `/api/superadmin/packages/${qs ? `?${qs}` : ""}`,
    );
  },
  createPackage: (payload: Partial<BillingPackage> & { name: string; code: string; price: string | number }) =>
    request<BillingPackage>("/api/superadmin/packages/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePackage: (uuid: string, payload: Partial<BillingPackage>) =>
    request<BillingPackage>(`/api/superadmin/packages/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePackage: (uuid: string) =>
    request<void>(`/api/superadmin/packages/${uuid}/`, { method: "DELETE" }),
  billingClinics: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<ClinicBilling> | ClinicBilling[]>(
      `/api/superadmin/clinics/${qs ? `?${qs}` : ""}`,
    );
  },
  updateBillingClinic: (id: number, payload: Partial<ClinicBilling>) =>
    request<ClinicBilling>(`/api/superadmin/clinics/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createClinicAdmin: (payload: {
    clinic_id: number;
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }) =>
    request<{ id: number; username: string; clinic: number; clinic_name: string }>(
      "/api/superadmin/clinic-admins/",
      { method: "POST", body: JSON.stringify(payload) },
    ),
  purchaseRequests: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<PurchaseRequest> | PurchaseRequest[]>(
      `/api/superadmin/purchase-requests/${qs ? `?${qs}` : ""}`,
    );
  },
  approvePurchaseRequest: (
    uuid: string,
    payload: { amount?: string | number; notes?: string; start_date?: string } = {},
  ) =>
    request<{ payment: ClinicPayment; subscription: ClinicSubscription }>(
      `/api/superadmin/purchase-requests/${uuid}/approve/`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  rejectPurchaseRequest: (uuid: string, payload: { notes?: string } = {}) =>
    request<PurchaseRequest>(`/api/superadmin/purchase-requests/${uuid}/reject/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  assignPackage: (payload: {
    clinic_id: number;
    package_id: number;
    amount?: string | number;
    notes?: string;
    start_date?: string;
  }) =>
    request<{ payment: ClinicPayment; subscription: ClinicSubscription }>(
      "/api/superadmin/assign/",
      { method: "POST", body: JSON.stringify(payload) },
    ),
  clinicSubscriptions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<ClinicSubscription> | ClinicSubscription[]>(
      `/api/superadmin/subscriptions/${qs ? `?${qs}` : ""}`,
    );
  },
  clinicPayments: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<ClinicPayment> | ClinicPayment[]>(
      `/api/superadmin/payments/${qs ? `?${qs}` : ""}`,
    );
  },
  ledger: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<LedgerListResponse | LedgerEntry[]>(
      `/api/superadmin/ledger/${qs ? `?${qs}` : ""}`,
    );
  },
  ledgerAdjustment: (payload: { clinic_id: number; amount: string | number; notes?: string }) =>
    request<LedgerEntry>("/api/superadmin/ledger/adjustment/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Clinic portal
  clinicMe: () => request<ClinicBilling>("/api/clinic/me/"),
  clinicPackages: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<BillingPackage> | BillingPackage[]>(
      `/api/clinic/packages/${qs ? `?${qs}` : ""}`,
    );
  },
  clinicPurchaseRequests: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<PurchaseRequest> | PurchaseRequest[]>(
      `/api/clinic/purchase-requests/${qs ? `?${qs}` : ""}`,
    );
  },
  createPurchaseRequest: (payload: { package_id: number; notes?: string }) =>
    request<PurchaseRequest>("/api/clinic/purchase-requests/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myClinicSubscriptions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<ClinicSubscription> | ClinicSubscription[]>(
      `/api/clinic/subscriptions/${qs ? `?${qs}` : ""}`,
    );
  },
  myClinicPayments: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<ClinicPayment> | ClinicPayment[]>(
      `/api/clinic/payments/${qs ? `?${qs}` : ""}`,
    );
  },
  myClinicLedger: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<LedgerListResponse | LedgerEntry[]>(
      `/api/clinic/ledger/${qs ? `?${qs}` : ""}`,
    );
  },
  clinicSpecialities: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Speciality> | Speciality[]>(
      `/api/clinic/specialities/${qs ? `?${qs}` : ""}`,
    );
  },
  clinicDoctors: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Doctor> | Doctor[]>(
      `/api/clinic/doctors/${qs ? `?${qs}` : ""}`,
    );
  },
  clinicDoctor: (uuid: string) =>
    request<ClinicDoctorDetail>(`/api/clinic/doctors/${uuid}/`),
  createClinicDoctor: (payload: {
    first_name: string;
    last_name: string;
    speciality_ids: number[];
    session_time: number;
    email: string;
    password: string;
    consultation_fee?: string | number;
  }) =>
    request<Doctor>("/api/clinic/doctors/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  patchClinicDoctor: (
    uuid: string,
    body: {
      first_name?: string;
      last_name?: string;
      speciality_ids?: number[];
      session_time?: number;
      is_active?: boolean;
      commission_type?: string;
      commission_value?: string;
      discounted_commission_type?: string;
      discounted_commission_value?: string;
      consultation_fee?: string;
    },
  ) =>
    request<ClinicDoctorDetail>(`/api/clinic/doctors/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteClinicDoctor: (uuid: string) =>
    request<void>(`/api/clinic/doctors/${uuid}/`, { method: "DELETE" }),
  importClinicDoctors: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{
      created: number;
      failed: { row: number; email: string | null; error: string }[];
      total_rows: number;
    }>("/api/clinic/doctors/import/", { method: "POST", body: fd });
  },
  clinicDoctorImportTemplateUrl: () =>
    `${API_URL}/api/clinic/doctors/import/template/`,
  clinicAppointments: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<Appointment> | Appointment[]>(
      `/api/clinic/appointments/${qs ? `?${qs}` : ""}`,
    );
  },
  clinicAppointment: (id: number | string) =>
    request<Appointment>(`/api/clinic/appointments/${id}/`),
  createClinicAppointment: (payload: {
    patient_name: string;
    patient_phone: string;
    doctor: number;
    token_date: string;
    slot_time?: string | null;
    notes?: string;
    patient_type?: string;
    jamat_name?: string;
  }) =>
    request<Appointment>("/api/clinic/appointments/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateClinicAppointment: (
    id: number | string,
    payload: Partial<{
      status: string;
      notes: string;
      doctor: number;
      token_date: string;
      scheduled_at: string;
      patient_type: string;
      jamat_name: string;
    }>,
  ) =>
    request<Appointment>(`/api/clinic/appointments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteClinicAppointment: (id: number | string) =>
    request<void>(`/api/clinic/appointments/${id}/`, { method: "DELETE" }),
};

export function unwrapList<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export function unwrapCount<T>(data: Paginated<T> | T[]): number {
  return Array.isArray(data) ? data.length : data.count;
}
