import { parseRes } from '../../utils/api';
import { toast } from "sonner";
import { env } from "../../config/env";
import { saveAuthSession } from "./authSession";

export type AuthMode = "login" | "register" | "forgot" | "reset";

export interface AuthErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const VERIFY_EMAIL_MESSAGE = "Tạo tài khoản thành công! Chúng tôi đã gửi email xác nhận đến email của bạn. Vui lòng bấm xác nhận trong email để hoàn tất đăng ký.";

export function getAuthErrorMessage(message: unknown, fallback = "Đã xảy ra lỗi, vui lòng thử lại."): string {
  const rawMessage = Array.isArray(message) ? message.join(", ") : String(message || "");
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("invalid credentials")) {
    return "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.";
  }

  if (
    normalized.includes("verify your email") ||
    normalized.includes("activate your account") ||
    normalized.includes("inactive") ||
    normalized.includes("chưa được kích hoạt") ||
    normalized.includes("chua duoc kich hoat")
  ) {
    return "Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư và bấm xác nhận trong email để hoàn tất đăng ký.";
  }

  if (normalized.includes("email or phone must be provided")) {
    return "Vui lòng nhập email hoặc số điện thoại.";
  }

  return rawMessage || fallback;
}

export function validateRegisterFields(fullName: string, email: string, phone: string, password: string): AuthErrors {
  const err: AuthErrors = {};
  const normalizedName = fullName.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    err.fullName = "Họ và tên không được để trống";
  } else if (normalizedName.length < 2) {
    err.fullName = "Họ và tên phải có ít nhất 2 ký tự";
  } else if (!/^[\p{L}\s.'-]+$/u.test(normalizedName)) {
    err.fullName = "Họ và tên chỉ được chứa chữ cái, khoảng trắng và dấu nối";
  }

  if (!email) {
    err.email = "Email không được để trống";
  } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
    err.email = "Email đăng ký phải là tài khoản Gmail (@gmail.com)";
  }

  if (phone && !/^(0|84|\+84)[35789][0-9]{8}$/.test(phone)) {
    err.phone = "Số điện thoại Việt Nam không hợp lệ";
  }

  if (!password) {
    err.password = "Mật khẩu không được để trống";
  } else if (password.length < 8) {
    err.password = "Mật khẩu phải có ít nhất 8 ký tự";
  } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    err.password = "Mật khẩu phải chứa cả chữ cái và chữ số";
  }

  return err;
}

export async function apiLogin(email: string, password: string, onSuccess: () => void) {
  const res = await fetch(`${env.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseRes(res);

  if (!res.ok) throw new Error(getAuthErrorMessage(data.message, "Đăng nhập thất bại"));

  saveAuthSession(data, false);
  toast.success("Đăng nhập thành công!");
  onSuccess();
}

export async function apiRegister(
  fullName: string,
  email: string,
  phone: string | undefined,
  password: string,
  onSuccess: () => void,
  setMode: (m: AuthMode) => void,
): Promise<AuthErrors | null> {
  const res = await fetch(`${env.API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: fullName.trim().replace(/\s+/g, " "), email, phone, password }),
  });
  const data = await parseRes(res);

  if (!res.ok) {
    const err: AuthErrors = {};
    if (typeof data.message === "string" && data.message.includes("Email")) {
      err.email = "Email này đã được sử dụng";
      toast.error("Email đăng ký đã tồn tại!");
    } else if (typeof data.message === "string" && data.message.includes("Phone")) {
      err.phone = "Số điện thoại này đã được sử dụng";
      toast.error("Số điện thoại đăng ký đã tồn tại!");
    } else {
      toast.error(getAuthErrorMessage(data.message, "Đăng ký thất bại"));
    }
    return err;
  }

  if (data.requiresVerification) {
    toast.success(VERIFY_EMAIL_MESSAGE, { duration: 8000 });
    setMode("login");
  } else {
    saveAuthSession(data, false);
    toast.success(data.message || VERIFY_EMAIL_MESSAGE, { duration: 8000 });
    onSuccess();
  }

  return null;
}
