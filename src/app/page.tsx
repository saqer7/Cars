"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Package,
  Wrench,
  AlertCircle,
  Receipt,
  Wallet
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DashboardData {
  dailyRevenue: number
  revenueChangePct: number
  servicesCompleted: number
  lowStockCount: number
  inventoryValue: number
  dailyExpenses?: number
  totalExpenses?: number
  revenueByDay: { name: string; revenue: number }[]
  recentActivity: {
    id: string
    type: "service" | "sale"
    action: string
    car: string
    price: number
    time: string
  }[]
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard")
      return res.json()
    },
  })
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
          <span>Dashboard Overview</span>
          <span dir="rtl">نظرة عامة على لوحة التحكم</span>
        </h1>
        <p className="text-slate-400 flex justify-between items-center w-full">
          <span>Welcome back to AutoLock ERP. Here's what's happening today.</span>
          <span dir="rtl">مرحباً بك مجدداً. إليك ما يحدث اليوم.</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-slate-400">Daily Revenue</CardTitle>
              <span dir="rtl" className="text-[10px] text-slate-500">الدخل اليومي</span>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? "—" : `$${(data?.dailyRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </div>
            <p className={`text-xs font-medium ${(data?.revenueChangePct ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {(data?.revenueChangePct ?? 0) >= 0 ? "+" : ""}{(data?.revenueChangePct ?? 0).toFixed(1)}% from yesterday / عن أمس
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-slate-400">Services Completed</CardTitle>
              <span dir="rtl" className="text-[10px] text-slate-500">الخدمات المكتملة</span>
            </div>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{isLoading ? "—" : (data?.servicesCompleted ?? 0)}</div>
            <p className="text-xs text-blue-500 font-medium">Today / اليوم</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-slate-400">Low Stock Items</CardTitle>
              <span dir="rtl" className="text-[10px] text-slate-500">قطع منخفضة المخزون</span>
            </div>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{isLoading ? "—" : (data?.lowStockCount ?? 0)}</div>
            <p className="text-xs text-amber-500 font-medium">Requires attention / يتطلب اهتمام</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-slate-400">Inventory Value</CardTitle>
              <span dir="rtl" className="text-[10px] text-slate-500">قيمة المخزون</span>
            </div>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? "—" : `$${(data?.inventoryValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-slate-500">Total parts in stock / إجمالي القطع</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-slate-400">Daily Expenses</CardTitle>
              <span dir="rtl" className="text-[10px] text-slate-500">المصاريف اليومية</span>
            </div>
            <Receipt className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {isLoading ? "—" : `-$${(data?.dailyExpenses ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-slate-500">Today / اليوم</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-slate-400">Net Today (Revenue − Expenses)</CardTitle>
              <span dir="rtl" className="text-[10px] text-slate-500">صافي اليوم (الدخل − المصاريف)</span>
            </div>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(data?.dailyRevenue ?? 0) - (data?.dailyExpenses ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {isLoading ? "—" : `$${((data?.dailyRevenue ?? 0) - (data?.dailyExpenses ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-slate-500">Revenue minus expenses / الدخل بعد خصم المصاريف</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex justify-between">
              <span>Revenue Trends (7 Days)</span>
              <span dir="rtl">اتجاهات الدخل (٧ أيام)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.revenueByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex justify-between">
              <span>Recent Activity</span>
              <span dir="rtl">النشاط الأخير</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-slate-500 text-sm">Loading...</div>
              ) : (data?.recentActivity ?? []).length === 0 ? (
                <div className="text-slate-500 text-sm">No recent activity / لا يوجد نشاط حديث</div>
              ) : (
                (data?.recentActivity ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{item.action}</p>
                      {item.car && <p className="text-xs text-slate-400">{item.car}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
