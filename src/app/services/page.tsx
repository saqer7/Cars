"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, startOfDay, endOfDay, subDays, subMonths } from "date-fns"
import { Search, PenTool as Tool, ShoppingBag, Receipt, Pencil, Trash2, Wrench, ShoppingCart, Plus, Calendar } from "lucide-react"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddServiceModal } from "@/components/services/add-service-modal"
import { EditServiceModal } from "@/components/services/edit-service-modal"
import { EditExpenseModal } from "@/components/expenses/edit-expense-modal"
import { EditSaleModal } from "@/components/sales/edit-sale-modal"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"

interface RecordItem {
    id: string
    type: "service" | "sale" | "expense"
    title: string
    description: string
    totalAmount: number
    createdAt: string
    rawService?: any
    rawExpense?: any
    rawSale?: any
}

export default function ServicesPage() {
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingService, setEditingService] = useState<any | null>(null)
    const [editingExpense, setEditingExpense] = useState<any | null>(null)
    const [editingSale, setEditingSale] = useState<any | null>(null)
    const [recordToDelete, setRecordToDelete] = useState<RecordItem | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Date Filtering State
    const [dateFrom, setDateFrom] = useState<string>("")
    const [dateTo, setDateTo] = useState<string>("")
    const [datePreset, setDatePreset] = useState<string>("all")

    const queryClient = useQueryClient()

    const { data: records, isLoading } = useQuery<RecordItem[]>({
        queryKey: ["records", dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (dateFrom) params.append("from", dateFrom)
            if (dateTo) params.append("to", dateTo)
            const res = await fetch(`/api/records?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
        },
    })

    const deleteServiceMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete service")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] })
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            toast.success("Service record deleted / تم حذف سجل الخدمة")
            setIsDeleteDialogOpen(false)
            setRecordToDelete(null)
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete service")
        }
    })

    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete expense")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] })
            toast.success("Expense deleted / تم حذف المصروف")
            setIsDeleteDialogOpen(false)
            setRecordToDelete(null)
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete expense")
        }
    })

    const deleteSaleMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/sales/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete sale")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] })
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            toast.success("Sale record deleted / تم حذف سجل البيع")
            setIsDeleteDialogOpen(false)
            setRecordToDelete(null)
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete sale")
        }
    })

    const filtered = records?.filter((r) => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description.toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === "all" || r.type === typeFilter
        return matchesSearch && matchesType
    })

    const handleEdit = (record: RecordItem) => {
        if (record.type === "service") {
            setEditingService(record.rawService)
        } else if (record.type === "expense") {
            setEditingExpense(record.rawExpense)
        } else if (record.type === "sale") {
            setEditingSale(record.rawSale)
        }
    }

    const applyPreset = (preset: string) => {
        setDatePreset(preset)
        const now = new Date()
        let from: Date | null = null
        let to: Date | null = endOfDay(now)

        switch (preset) {
            case "today":
                from = startOfDay(now)
                break
            case "yesterday":
                from = startOfDay(subDays(now, 1))
                to = endOfDay(subDays(now, 1))
                break
            case "last7":
                from = startOfDay(subDays(now, 7))
                break
            case "lastMonth":
                from = startOfDay(subMonths(now, 1))
                break
            case "all":
            default:
                from = null
                to = null
                break
        }

        setDateFrom(from ? from.toISOString() : "")
        setDateTo(to ? to.toISOString() : "")
    }

    const handleDelete = (record: RecordItem) => {
        setRecordToDelete(record)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (!recordToDelete) return
        if (recordToDelete.type === "service") {
            deleteServiceMutation.mutate(recordToDelete.id)
        } else if (recordToDelete.type === "expense") {
            deleteExpenseMutation.mutate(recordToDelete.id)
        } else if (recordToDelete.type === "sale") {
            deleteSaleMutation.mutate(recordToDelete.id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
                        <span>Records History</span>
                        <span dir="rtl">سجل العمليات</span>
                    </h1>
                    <p className="text-slate-400 flex justify-between items-center w-full">
                        <span>A history of all sales, services, and expenses.</span>
                        <span dir="rtl">سجل بجميع عمليات البيع والخدمات والمصاريف.</span>
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 shrink-0 h-12 px-6 font-bold"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    <span>New Service / خدمة جديدة</span>
                </Button>
            </div>

            <AddServiceModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
            />

            <EditServiceModal
                service={editingService}
                open={!!editingService}
                onOpenChange={(open) => !open && setEditingService(null)}
            />

            <EditExpenseModal
                expense={editingExpense}
                open={!!editingExpense}
                onOpenChange={(open) => !open && setEditingExpense(null)}
            />

            <EditSaleModal
                sale={editingSale}
                open={!!editingSale}
                onOpenChange={(open) => !open && setEditingSale(null)}
            />

            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                isPending={deleteServiceMutation.isPending || deleteExpenseMutation.isPending || deleteSaleMutation.isPending}
                title={`Delete ${recordToDelete?.type} / حذف`}
                description={`Are you sure you want to delete this ${recordToDelete?.type} record? / هل أنت متأكد من حذف هذا السجل؟`}
            />

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-white text-lg">Transactions List / قائمة العمليات</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={typeFilter === "all" ? "default" : "outline"}
                                size="sm"
                                className={typeFilter === "all" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                                onClick={() => setTypeFilter("all")}
                            >
                                All
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
                                <Receipt className="w-3 h-3 mr-1" /> Expenses
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search records... / بحث..."
                                className="pl-10 bg-slate-950 border-slate-800 text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Date Filters Section */}
                    <div className="space-y-4 mb-6 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-400 mr-2">Quick Filters:</span>
                            {[
                                { id: "all", label: "All Time", ar: "الكل" },
                                { id: "today", label: "Today", ar: "اليوم" },
                                { id: "yesterday", label: "Yesterday", ar: "أمس" },
                                { id: "last7", label: "Last 7 Days", ar: "آخر 7 أيام" },
                                { id: "lastMonth", label: "Last Month", ar: "الشهر الماضي" },
                            ].map((p) => (
                                <Button
                                    key={p.id}
                                    variant={datePreset === p.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => applyPreset(p.id)}
                                    className={datePreset === p.id ? "bg-blue-600" : "border-slate-800 text-slate-400 hover:text-white"}
                                >
                                    {p.label} / {p.ar}
                                </Button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">Custom Range:</span>
                                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-2 py-1">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <input
                                        type="date"
                                        className="bg-transparent text-sm text-white outline-none border-none p-1 [color-scheme:dark]"
                                        value={dateFrom ? format(new Date(dateFrom), "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            setDatePreset("custom")
                                            setDateFrom(e.target.value ? new Date(e.target.value).toISOString() : "")
                                        }}
                                    />
                                    <span className="text-slate-500">to</span>
                                    <input
                                        type="date"
                                        className="bg-transparent text-sm text-white outline-none border-none p-1 [color-scheme:dark]"
                                        value={dateTo ? format(new Date(dateTo), "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            setDatePreset("custom")
                                            setDateTo(e.target.value ? new Date(e.target.value).toISOString() : "")
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setDateFrom("")
                                        setDateTo("")
                                        setDatePreset("all")
                                    }}
                                    className="text-xs text-slate-500 hover:text-white"
                                >
                                    Clear / مسح
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-800 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-950">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Date / التاريخ</TableHead>
                                    <TableHead className="text-slate-400">Type / النوع</TableHead>
                                    <TableHead className="text-slate-400">Title / العنوان</TableHead>
                                    <TableHead className="text-slate-400">Description / الوصف</TableHead>
                                    <TableHead className="text-slate-400 text-right">Amount / المبلغ</TableHead>
                                    <TableHead className="text-slate-400 text-right w-[100px]">Actions</TableHead>
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
                                ) : filtered?.length ? (
                                    filtered.map((record) => (
                                        <TableRow key={`${record.type}-${record.id}`} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="text-slate-300">
                                                {format(new Date(record.createdAt), "MMM d, HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {record.type === "service" && (
                                                        <Badge variant="outline" className="border-blue-600/50 text-blue-400 bg-blue-500/10">
                                                            <Tool className="h-3 w-3 mr-1" /> Service
                                                        </Badge>
                                                    )}
                                                    {record.type === "sale" && (
                                                        <Badge variant="outline" className="border-emerald-600/50 text-emerald-400 bg-emerald-500/10">
                                                            <ShoppingBag className="h-3 w-3 mr-1" /> Sale
                                                        </Badge>
                                                    )}
                                                    {record.type === "expense" && (
                                                        <Badge variant="outline" className="border-amber-600/50 text-amber-400 bg-amber-500/10">
                                                            <Receipt className="h-3 w-3 mr-1" /> Expense
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white font-medium">{record.title}</TableCell>
                                            <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">{record.description}</TableCell>
                                            <TableCell className={`text-right font-bold ${record.type === "expense" ? "text-amber-400" : "text-emerald-400"}`}>
                                                {record.type === "expense" ? "-" : ""}{formatCurrency(record.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {(record.type === "service" || record.type === "expense" || record.type === "sale") && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                                                onClick={() => handleEdit(record)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                                                onClick={() => handleDelete(record)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            No records found / لا توجد قيود.
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
