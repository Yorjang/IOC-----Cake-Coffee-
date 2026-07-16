
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud, PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Cài đặt hệ thống</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thông tin cửa hàng</h3>
          {["Tên cửa hàng", "Email liên hệ", "Số điện thoại", "Địa chỉ"].map((label, i) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={["Sweet Bean Coffee & Cake", "hello@sweetbean.vn", "0909 888 777", "123 Nguyễn Huệ, Q1, TP.HCM"][i]} />
            </div>
          ))}
          <AdminBtn>Lưu thay đổi</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cấu hình giao hàng</h3>
          {[["Phí giao hàng cơ bản", "25.000đ"], ["Miễn phí từ", "200.000đ"], ["Bán kính giao (km)", "15"], ["Thời gian giao (phút)", "45-90"]].map(([l, v]) => (
            <div key={l}>
              <label className="mb-1 block text-xs text-muted-foreground">{l}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={v} />
            </div>
          ))}
          <AdminBtn>Lưu cấu hình</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cổng thanh toán</h3>
          {[["COD", true], ["Momo", true], ["VNPay", true], ["ZaloPay", false]].map(([name, active]) => (
            <div key={name as string} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{name as string}</span>
              <button className={`rounded-full px-3 py-1 text-xs transition ${active ? "bg-green-900/50 text-green-400" : "bg-sidebar-accent text-muted-foreground"}`}>{active ? "Bật" : "Tắt"}</button>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thông báo</h3>
          {["Email đơn hàng mới", "SMS xác nhận", "Thông báo hết hàng", "Báo cáo doanh thu hàng ngày"].map(n => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{n}</span>
              <button className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">Bật</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


