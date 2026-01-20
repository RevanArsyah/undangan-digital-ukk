export enum AttendanceStatus {
  HADIR = "hadir",
  TIDAK_HADIR = "tidak_hadir",
  RAGU = "ragu",
}

export interface RSVP {
  id: number;
  guest_name: string;
  email?: string;
  phone?: string;
  attendance: AttendanceStatus;
  guest_count: number;
  message?: string;
  created_at: string;
}

export interface Wish {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export interface WeddingConfig {
  couple: {
    bride: {
      name: string;
      fullName: string;
      parents: string;
      instagram: string;
      image: string;
    };
    groom: {
      name: string;
      fullName: string;
      parents: string;
      instagram: string;
      image: string;
    };
  };
  venue: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  events: {
    akad: WeddingEvent;
    resepsi: WeddingEvent;
  };
  hero: {
    image: string;
    city: string;
  };
}

export interface WeddingEvent {
  title: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: Date;
  endDateTime: Date;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  full_name?: string;
  email?: string;
  role: "super_admin" | "admin" | "viewer";
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AuthSession {
  userId: number;
  username: string;
  role: string;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: number;
  created_at: string;
}

