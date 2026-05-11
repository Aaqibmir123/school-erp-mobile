export interface ApplySchoolDTO {
  schoolName: string;
  principalName: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
}

export interface LoginDTO {
  email?: string;
  emailOrPhone?: string;
  phone?: string;
  password: string;
}

export interface LoginResponse {
  user: {
    _id: string;
    email?: string;
    name?: string;
    phone?: string;
    image?: string;
    isFirstLogin?: boolean;
    schoolId?: string;
    role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
  };
  token: string;
  refreshToken?: string;
  students?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    rollNumber?: number;
    schoolId?: string;
  }[];
}
