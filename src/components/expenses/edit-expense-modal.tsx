"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    type: z.enum(["PARTS", "SERVICE", "RENT", "UTILITIES", "OTHER"]),
    description: z.string().min(2, "Enter description"),
    amount: z.number().positive("Amount must be positive"),
    expenseDate: z.string().min(1),
})

type FormValues = z.infer<typeof formSchema>

interface EditExpenseModalProps {
    expense: any // Should ideally be a proper type
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditExpenseModal({ expense, open, onOpenChange }: EditExpenseModalProps) {
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "PARTS",
            description: "",
            amount: 0,
            expenseDate: new Date().toISOString().split("T")[0],
        },
    })

    useEffect(() => {
        if (expense && open) {
            form.reset({
                type: expense.type,
                description: expense.description,
                amount: Number(expense.amount),
                expenseDate: new Date(expense.expenseDate).toISOString().split("T")[0],
            })
        }
    }, [expense, open, form])

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const res = await fetch(`/api/expenses/${expense.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    expenseDate: new Date(values.expenseDate).toISOString(),
                }),
            })
            if (!res.ok) throw new Error("Failed to update expense")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            queryClient.invalidateQueries({ queryKey: ["records"] })
            toast.success("Expense updated! / تم تحديث المصروف")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update expense / فشل تحديث المصروف")
        },
    })

    function onSubmit(values: FormValues) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Expense / تعديل المصروف</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update details for this expense record.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type / النوع</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            <SelectItem value="PARTS">Parts Purchase / شراء قطع</SelectItem>
                                            <SelectItem value="SERVICE">Service / خدمة</SelectItem>
                                            <SelectItem value="RENT">Rent / إيجار</SelectItem>
                                            <SelectItem value="UTILITIES">Utilities / مرافق</SelectItem>
                                            <SelectItem value="OTHER">Other / أخرى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description / الوصف</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Bought 10 keys from supplier"
                                            {...field}
                                            className="bg-slate-950 border-slate-800 text-white"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (ILS) / المبلغ</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            value={field.value || ""}
                                            className="bg-slate-950 border-slate-800 text-white"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="expenseDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date / التاريخ</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            className="bg-slate-950 border-slate-800 text-white"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Updating..." : "Update Expense / تحديث"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
