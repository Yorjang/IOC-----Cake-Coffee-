// Auth-related types and hook logic shared across auth forms
import { useState } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";

export type AuthMode = "login" | "register" | "forgot";

export interface AuthErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export function validateRegisterFields(fullName: string, email: string, phone: string, password: string): AuthErrors {
  const err: AuthErrors = {};
  if (!fullName.trim()) {
    err.fullName = "Họ và tên không được để trống";
  } else if (fullName.trim().length < 2) {
    err.fullName = "Họ và tên phải có ít nhất 2 ký tự";
  } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơư\s]+$/.test(fullName)) {
    err.fullName = "Họ và tên chỉ được chứa chữ cái và khoảng trắng";
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));
  toast.success("Đăng nhập thành công!");
  onSuccess();
}

export async function apiRegister(
  fullName: string,
  email: string,
  phone: string | undefined,
  onSuccess: () => void,
  setMode: (m: AuthMode) => void,
): Promise<AuthErrors | null> {
  const res = await fetch(`${env.API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err: AuthErrors = {};
    if (typeof data.message === "string" && data.message.includes("Email")) {
      err.email = "Email này đã được sử dụng";
      toast.error("Email đăng ký đã tồn tại!");
    } else if (typeof data.message === "string" && data.message.includes("Phone")) {
      err.phone = "Số điện thoại này đã được sử dụng";
      toast.error("Số điện thoại đăng ký đã tồn tại!");
    } else {
      toast.error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Đăng ký thất bại");
    }
    return err;
  }
  if (data.requiresVerification) {
    toast.success(data.message || "Đăng ký thành công! Vui lòng kiểm tra email.");
    setMode("login");
  } else {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    toast.success(data.message || "Đăng ký thành công!");
    onSuccess();
  }
  return null;
}
