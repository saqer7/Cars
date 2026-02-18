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
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts"
import { Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReportsData {
    monthlySales: { name: string; sales: number }[]
    monthlyExpenses?: { name: string; expenses: number }[]
    inventoryDistribution: { name: string; count: number; value: number }[]
}

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function ReportsPage() {
    const { data, isLoading } = useQuery<ReportsData>({
        queryKey: ["reports"],
        queryFn: async () => {
            const res = await fetch("/api/reports?months=6")
            if (!res.ok) throw new Error("Failed to fetch reports")
            return res.json()
        },
    })
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
                    <span>Reports & Analytics</span>
                    <span dir="rtl">التقارير والتحليلات</span>
                </h1>
                <p className="text-slate-400 flex justify-between items-center w-full">
                    <span>View your business performance and inventory trends.</span>
                    <span dir="rtl">عرض أداء العمل وتوجهات المخزون.</span>
                </p>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" className="bg-slate-900 border-slate-800 text-white">
                    <Filter className="mr-2 h-4 w-4" /> Filter / تصفية
                </Button>
                <Button variant="outline" className="bg-slate-900 border-slate-800 text-white">
                    <Download className="mr-2 h-4 w-4" /> Export / تصدير
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex justify-between">
                            <span>Monthly Sales</span>
                            <span dir="rtl">المبيعات الشهرية</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-500">Loading...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data?.monthlySales ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                                        itemStyle={{ color: "#fff" }}
                                    />
                                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex justify-between">
                            <span>Monthly Expenses</span>
                            <span dir="rtl">المصاريف الشهرية</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-500">Loading...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data?.monthlyExpenses ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                                        itemStyle={{ color: "#fff" }}
                                    />
                                    <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex justify-between">
                            <span>Inventory by Category</span>
                            <span dir="rtl">المخزون حسب الفئة</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-500">Loading...</div>
                        ) : !data?.inventoryDistribution?.length ? (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                No inventory data / لا يوجد بيانات مخزون
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={data.inventoryDistribution}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {data.inventoryDistribution.map((_, index) => (
                                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                                        formatter={(value: number, _name: string, props: { payload: { value: number } }) =>
                                            `${value} units • $${props.payload.value.toLocaleString()}`
                                        }
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
