"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Coins } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddExpenseModal } from "@/components/expenses/add-expense-modal"

interface Expense {
    id: string
    type: string
    description: string
    amount: number
    expenseDate: string
    createdAt: string
}

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
    PARTS: { en: "Parts Purchase", ar: "شراء قطع" },
    SERVICE: { en: "Service", ar: "خدمة" },
    RENT: { en: "Rent", ar: "إيجار" },
    UTILITIES: { en: "Utilities", ar: "مرافق" },
    OTHER: { en: "Other", ar: "أخرى" },
}

export default function ExpensesPage() {
    const [search, setSearch] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const { data: expenses, isLoading } = useQuery<Expense[]>({
        queryKey: ["expenses"],
        queryFn: async () => {
            const res = await fetch("/api/expenses")
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
        },
    })

    const filtered = expenses?.filter(
        (e) =>
            e.description.toLowerCase().includes(search.toLowerCase()) ||
            (TYPE_LABELS[e.type]?.en.toLowerCase().includes(search.toLowerCase()))
    )

    const totalExpenses = filtered?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
                        <span>Expenses / المصاريف</span>
                    </h1>
                    <p className="text-slate-400 flex justify-between items-center w-full">
                        <span>Track purchases and outgoing costs.</span>
                        <span dir="rtl">تتبع المشتريات والمصروفات الخارجة.</span>
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add Expense / إضافة مصروف</span>
                </Button>
            </div>

            <AddExpenseModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search expenses... / بحث..."
                                className="pl-10 bg-slate-950 border-slate-800 text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-amber-400 font-bold">
                            <Coins className="h-5 w-5" />
                            <span>Total: {formatCurrency(totalExpenses)}</span>
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-800 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-950">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Date / التاريخ</TableHead>
                                    <TableHead className="text-slate-400">Type / النوع</TableHead>
                                    <TableHead className="text-slate-400">Description / الوصف</TableHead>
                                    <TableHead className="text-slate-400 text-right">Amount / المبلغ</TableHead>
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
                                        </TableRow>
                                    ))
                                ) : filtered?.length ? (
                                    filtered.map((exp) => (
                                        <TableRow key={exp.id} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="text-slate-300">
                                                {format(new Date(exp.expenseDate), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-amber-600/50 text-amber-400 bg-amber-500/10">
                                                    {TYPE_LABELS[exp.type]?.en ?? exp.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300">{exp.description}</TableCell>
                                            <TableCell className="text-right text-amber-400 font-bold">
                                                -{formatCurrency(exp.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                            No expenses found / لا توجد مصاريف.
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
