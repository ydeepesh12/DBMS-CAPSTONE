export type UserRole = 
  | 'OFFICER' 
  | 'PAYMENT_ADMIN' 
  | 'APPEAL_OFFICER' 
  | 'TRAFFIC_ADMIN' 
  | 'MANAGEMENT' 
  | 'OWNER';

export interface User {
  userId: number;
  username: string;
  role: UserRole;
  officer?: {
    name: string;
    badge_number: string;
    designation: string;
    police_station: string;
  } | null;
  owner?: {
    name: string;
    phone: string;
    national_id: string;
  } | null;
}

export interface Challan {
  challan_id: number;
  challan_number: string;
  violation_id?: number;
  fine_amount: number | string;
  late_fee: number | string;
  total_amount: number | string;
  issue_date: string;
  due_date: string;
  status: 'UNPAID' | 'PAID' | 'APPEALED' | 'CANCELLED' | 'OVERDUE';
  appeal_window_end?: string;
  registration_no: string;
  make_model?: string;
  vehicle_type?: string;
  owner_name?: string;
  owner_phone?: string;
  violation_title?: string;
  section_act?: string;
  area_name?: string;
  junction_name?: string;
  violation_timestamp?: string;
  receipt_number?: string;
  payment_date?: string;
  days_overdue?: number;
}

export interface ViolationType {
  violation_type_id: number;
  code: string;
  title: string;
  section_act: string;
  base_fine: number | string;
  late_fee_rate: number | string;
  demerit_points: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LocationRecord {
  location_id: number;
  area_name: string;
  junction_name: string;
  latitude: number | string;
  longitude: number | string;
  speed_limit: number;
  camera_id?: string;
  zone_type: string;
}

export interface AppealRecord {
  appeal_id: number;
  challan_id: number;
  challan_number: string;
  reason: string;
  appeal_date: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  decision_date?: string;
  officer_remarks?: string;
  total_amount: number | string;
  registration_no: string;
  owner_name: string;
  violation_title: string;
}
