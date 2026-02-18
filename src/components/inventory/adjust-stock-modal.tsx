"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Product {
    id: string
    partName: string
    stockQuantity: number
}

interface AdjustStockModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product | null
}

export function AdjustStockModal({ open, onOpenChange, product }: AdjustStockModalProps) {
    const queryClient = useQueryClient()
    const [newQuantity, setNewQuantity] = useState("")

    useEffect(() => {
        if (product) {
            setNewQuantity(String(product.stockQuantity))
        }
    }, [product])

    const mutation = useMutation({
        mutationFn: async () => {
            if (!product) throw new Error("No product selected")
            const qty = parseInt(newQuantity, 10)
            if (isNaN(qty) || qty < 0) throw new Error("Enter a valid quantity")
            const response = await fetch(`/api/inventory/${product.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stockQuantity: qty }),
            })
            if (!response.ok) throw new Error("Failed to update stock")
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            toast.success("Stock updated! / تم تحديث الكمية")
            onOpenChange(false)
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to update stock / فشل التحديث")
        },
    })

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        mutation.mutate()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Adjust Stock</span>
                        <span dir="rtl">تعديل الكمية</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 flex justify-between">
                        <span>Set the new stock quantity for this item.</span>
                        <span dir="rtl">تعيين الكمية الجديدة للمخزون.</span>
                    </DialogDescription>
                </DialogHeader>
                {product && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-white mb-1">{product.partName}</p>
                            <p className="text-xs text-slate-500">Current stock: {product.stockQuantity}</p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">
                                New quantity / الكمية الجديدة
                            </label>
                            <Input
                                type="number"
                                min={0}
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white"
                                placeholder="0"
                            />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Updating..." : "Update Stock / تحديث الكمية"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
