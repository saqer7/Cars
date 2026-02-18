"use client"

import { useQuery } from "@tanstack/react-query"
import {
    Plus,
    Wrench,
    User,
    Search,
    ShoppingCart,
    Filter,
    CreditCard,
} from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddServiceModal } from "@/components/services/add-service-modal"
import type { UnifiedRecord } from "@/app/api/records/route"

export default function RecordsPage() {
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState<"all" | "service" | "sale" | "expense">("all")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const { data: records, isLoading } = useQuery<UnifiedRecord[]>({
        queryKey: ["records"],
        queryFn: async () => {
            const res = await fetch("/api/records")
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
        },
    })

    const filteredRecords = records?.filter((r) => {
        const matchesSearch =
            (r.customerName?.toLowerCase().includes(search.toLowerCase())) ||
            (r.carPlateNumber?.toLowerCase().includes(search.toLowerCase())) ||
            (r.serviceType?.toLowerCase().includes(search.toLowerCase())) ||
            (r.description?.toLowerCase().includes(search.toLowerCase())) ||
            (r.expenseType?.toLowerCase().includes(search.toLowerCase())) ||
            r.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()))
        const matchesType =
            typeFilter === "all" ||
            (typeFilter === "service" && r.type === "service") ||
            (typeFilter === "sale" && r.type === "sale") ||
            (typeFilter === "expense" && r.type === "expense")
        return matchesSearch && matchesType
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
                        <span>All Records</span>
                        <span dir="rtl">السجلات الكاملة</span>
                    </h1>
                    <p className="text-slate-400 flex justify-between items-center w-full">
                        <span>Services and sales in one place.</span>
                        <span dir="rtl">الخدمات والمبيعات في مكان واحد.</span>
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Service / خدمة جديدة</span>
                </Button>
            </div>

            <AddServiceModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-col sm:flex-row gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search customer, plate, items... / بحث..."
                            className="pl-10 bg-slate-950 border-slate-800 text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button
                            variant={typeFilter === "all" ? "default" : "outline"}
                            size="sm"
                            className={typeFilter === "all" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                            onClick={() => setTypeFilter("all")}
                        >
                            All / الكل
                        </Button>
                        <Button
                            variant={typeFilter === "service" ? "default" : "outline"}
                            size="sm"
                            className={typeFilter === "service" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                            onClick={() => setTypeFilter("service")}
                        >
                            <Wrench className="w-3 h-3 mr-1" /> Services
                        </Button>
                        <Button
                            variant={typeFilter === "sale" ? "default" : "outline"}
                            size="sm"
                            className={typeFilter === "sale" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                            onClick={() => setTypeFilter("sale")}
                        >
                            <ShoppingCart className="w-3 h-3 mr-1" /> Sales
                        </Button>
                        <Button
                            variant={typeFilter === "expense" ? "default" : "outline"}
                            size="sm"
                            className={typeFilter === "expense" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                            onClick={() => setTypeFilter("expense")}
                        >
                            <Badge variant="outline" className="w-3 h-3 mr-1 p-0 border-orange-500 bg-orange-500" /> Expenses
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-950">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">
                                        <div className="flex flex-col">
                                            <span>Date</span>
                                            <span dir="rtl" className="text-[10px] opacity-70">التاريخ</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-slate-400">
                                        <div className="flex flex-col">
                                            <span>Type</span>
                                            <span dir="rtl" className="text-[10px] opacity-70">النوع</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-slate-400">
                                        <div className="flex flex-col">
                                            <span>Customer / Description</span>
                                            <span dir="rtl" className="text-[10px] opacity-70">العميل</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-slate-400">
                                        <div className="flex flex-col">
                                            <span>Car Plate</span>
                                            <span dir="rtl" className="text-[10px] opacity-70">رقم اللوحة</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-slate-400">
                                        <div className="flex flex-col">
                                            <span>Details</span>
                                            <span dir="rtl" className="text-[10px] opacity-70">التفاصيل</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-slate-400 text-right">
                                        <div className="flex flex-col items-end">
                                            <span>Total</span>
                                            <span dir="rtl" className="text-[10px] opacity-70">الإجمالي</span>
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-slate-800">
                                            <TableCell><Skeleton className="h-6 w-full bg-slate-800" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-full bg-slate-800" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-full bg-slate-800" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-full bg-slate-800" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-full bg-slate-800" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-full bg-slate-800" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredRecords?.length ? (
                                    filteredRecords.map((record) => (
                                        <TableRow key={`${record.type}-${record.id}`} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="text-slate-300">
                                                {format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        record.type === "service"
                                                            ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                                                            : record.type === "sale"
                                                                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                                                : "border-orange-500/50 text-orange-400 bg-orange-500/10"
                                                    }
                                                >
                                                    {record.type === "service" ? (
                                                        <><Wrench className="w-3 h-3 mr-1" /> Service</>
                                                    ) : record.type === "sale" ? (
                                                        <><ShoppingCart className="w-3 h-3 mr-1" /> Sale</>
                                                    ) : (
                                                        <><CreditCard className="w-3 h-3 mr-1" /> Expense</>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300 font-medium">
                                                {record.type === "service" ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                                                        {record.customerName}
                                                    </div>
                                                ) : record.type === "expense" ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-300 font-medium">{record.expenseType}</span>
                                                        <span className="text-xs text-slate-500">{record.description}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {record.type === "service" ? (
                                                    <Badge variant="outline" className="border-slate-700 text-blue-400 font-bold uppercase">
                                                        {record.carPlateNumber}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {record.type === "service" ? (
                                                    <span className="text-slate-300">{record.serviceType}</span>
                                                ) : null}
                                                {record.items.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {record.items.map((p, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="secondary"
                                                                className="bg-slate-800 text-[10px]"
                                                            >
                                                                {p.name} ×{p.quantity}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-white">
                                                <span className={record.type === "expense" ? "text-orange-400" : "text-white"}>
                                                    {record.type === "expense" ? "-" : ""}${record.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            No records found / لم يتم العثور على سجلات.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
