export type UserInfo = {
  id: number;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "clinic_admin" | "doctor" | "patient" | string;
  full_name: string;
};

export type BillingPackage = {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string;
  price: string;
  duration_days: number;
  max_doctors: number;
  max_patients: number;
  features: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PurchaseRequest = {
  id: number;
  uuid: string;
  clinic: number;
  clinic_name: string;
  package: number;
  package_name: string;
  package_price: string;
  requested_by: number | null;
  requested_by_username: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActiveSubscriptionSummary = {
  package_name: string;
  package_code: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  renew_by: string;
};

export type ClinicPaymentSummary = {
  package_status: "active" | "none" | "expired";
  package_name: string | null;
  package_code: string | null;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
  renew_by: string | null;
  package_price: string | null;
  amount_paid: string | null;
  due: string;
  paid_this_month: string;
  payment_status: "paid" | "partial" | "unpaid" | "n/a";
  ledger_balance: string;
};

export type ClinicSubscription = {
  id: number;
  uuid: string;
  clinic: number;
  clinic_name: string;
  package: number;
  package_name: string;
  package_code: string;
  duration_days?: number;
  start_date: string;
  end_date: string;
  amount_paid: string;
  status: "pending" | "active" | "expired" | "cancelled";
  is_active: boolean;
  is_currently_valid: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ClinicPayment = {
  id: number;
  uuid: string;
  clinic: number;
  clinic_name: string;
  amount: string;
  method: "cash";
  status: "pending" | "completed" | "cancelled";
  purchase_request: number | null;
  subscription: number | null;
  recorded_by: number | null;
  recorded_by_username: string | null;
  paid_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type LedgerEntry = {
  id: number;
  uuid: string;
  clinic: number;
  clinic_name: string;
  entry_type: "payment_in" | "package_charge" | "adjustment";
  amount: string;
  balance_after: string;
  payment: number | null;
  subscription: number | null;
  notes: string;
  created_by: number | null;
  created_by_username: string | null;
  created_at: string;
};

export type SuperadminDashboard = {
  active_subscriptions: number;
  pending_requests: number;
  total_packages: number;
  total_clinics: number;
  cash_collected_month: string;
  recent_payments: ClinicPayment[];
  pending_request_list: PurchaseRequest[];
};

export type Speciality = {
  id: number;
  name: string;
  icon: string | null;
  icon_url: string;
  display_icon: string;
  is_active: boolean;
  created_at: string;
};

export type Clinic = {
  id: number;
  name: string;
  address: string;
  city: string;
  area: string;
  phone: string;
  billing_email?: string;
  owner_name?: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  has_active_package?: boolean;
  created_at: string;
};

export type Doctor = {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  specialities: Speciality[];
  clinic: number | null;
  clinic_name: string | null;
  session_time: number;
  consultation_fee?: string;
  is_active: boolean;
  has_active_subscription: boolean;
  subscription_status: "subscribed" | "expired" | "none";
  created_at: string;
};

export type ClinicDoctorLink = {
  id: number;
  is_primary: boolean;
  commission_type: "percentage" | "fixed" | string;
  commission_value: string;
  commission_updated_at: string | null;
  discounted_commission_type: "percentage" | "fixed" | string;
  discounted_commission_value: string;
  discounted_commission_updated_at: string | null;
};

export type ClinicDoctorAvailabilityWindow = {
  id: number;
  weekday: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  specific_date?: string;
};

export type ClinicDoctorSlotDay = {
  date: string;
  date_label: string;
  times: string[];
};

export type ClinicDoctorStats = {
  patient_count: number;
  upcoming_count: number;
  completed_count: number;
  cancelled_count: number;
  gross_fees: string;
  clinic_commission_total: string;
  doctor_earnings_total: string;
};

export type ClinicDoctorPatient = {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  visit_count: number;
};

export type ClinicDoctorAppointment = {
  id: number;
  scheduled_at: string | null;
  token_date: string | null;
  token_number: number;
  status: string;
  patient_id: number | null;
  patient_name: string;
  patient_phone: string;
  patient_type?: "normal" | "discounted" | string;
  jamat_name?: string;
  fee_base: string;
  payment_status: string;
  payment_method: string;
  clinic_share: string;
  doctor_share: string;
  commission_type: string;
  commission_value: string;
};

export type ClinicDoctorDetail = Doctor & {
  clinic_link: ClinicDoctorLink;
  availability: {
    weekly: ClinicDoctorAvailabilityWindow[];
    date_overrides: ClinicDoctorAvailabilityWindow[];
  };
  upcoming_slots: ClinicDoctorSlotDay[];
  stats: ClinicDoctorStats;
  patients: ClinicDoctorPatient[];
  appointments: ClinicDoctorAppointment[];
};

export type DoctorSubscription = {
  id: number;
  uuid: string;
  doctor: number;
  doctor_uuid: string;
  doctor_name: string;
  doctor_email: string;
  amount: string;
  payment_method: "cash";
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_currently_valid: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type MarketingSubscription = {
  id: number;
  uuid: string;
  doctor: number;
  doctor_uuid: string;
  doctor_name: string;
  doctor_email?: string;
  amount: string;
  payment_method: "cash";
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_currently_valid: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: number;
  uuid: string;
  phone: string;
  name: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: number;
  patient: number;
  patient_name: string;
  patient_phone: string;
  doctor: number;
  doctor_name: string;
  scheduled_at: string;
  token_date: string;
  token_number: number;
  token_code: string;
  status: "upcoming" | "completed" | "cancelled" | "rejected";
  notes: string;
  patient_type?: "normal" | "discounted" | string;
  jamat_name?: string;
  created_at: string;
  updated_at: string;
};

export type PatientDetail = Patient & {
  appointments: Appointment[];
};

export type DoctorAvailability = {
  id: number;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
};

export type DashboardStats = {
  total_doctors: number;
  total_patients: number;
  total_appointments: number;
  upcoming_today: Appointment[];
  recent_appointments: Appointment[];
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ClinicBilling = Clinic & {
  billing_email?: string;
  owner_name?: string;
  has_active_package?: boolean;
  ledger_balance?: string;
  clinic_admin_username?: string | null;
  active_subscription?: ActiveSubscriptionSummary | null;
  payment_summary?: ClinicPaymentSummary | null;
};

export type LedgerListResponse = Paginated<LedgerEntry> & {
  ledger_balance?: string | null;
  active_subscription?: ActiveSubscriptionSummary | null;
  payment_summary?: ClinicPaymentSummary | null;
};
