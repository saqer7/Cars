"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Search,
    Plus,
    Minus,
    Trash2,
    Save,
    X
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface Product {
    id: string
    partName: string
    category: string
    carBrand: string
    carModel: string
    yearRange: string
    stockQuantity: number
    sellingPrice: number
}

interface CartItem {
    id: string
    partName: string
    sellingPrice: number
    quantity: number
    stockQuantity: number // Current available stock (to limit increase)
    isOld?: boolean // Mark items that were already in the sale
}

interface EditSaleModalProps {
    sale: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditSaleModal({ sale, open, onOpenChange }: EditSaleModalProps) {
    const [search, setSearch] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const queryClient = useQueryClient()

    // Fetch all products for selection
    const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
        queryKey: ['inventory', 'pos', search],
        queryFn: async () => {
            const res = await fetch(`/api/inventory?q=${search}`)
            return res.json()
        },
        enabled: open
    })

    useEffect(() => {
        if (sale && open) {
            // Transform sale items into cart items
            const initialCart = sale.items.map((item: any) => ({
                id: item.productId,
                partName: item.product.partName,
                sellingPrice: Number(item.priceAtSale),
                quantity: item.quantity,
                stockQuantity: item.product.stockQuantity + item.quantity, // Stock if this sale was reverted
                isOld: true
            }))
            setCart(initialCart)
        }
    }, [sale, open])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) }
                        : item
                )
            }
            return [...prev, {
                id: product.id,
                partName: product.partName,
                sellingPrice: Number(product.sellingPrice),
                quantity: 1,
                stockQuantity: product.stockQuantity,
                isOld: false
            }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, Math.min(item.quantity + delta, item.stockQuantity))
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const total = cart.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.quantity), 0)

    const mutation = useMutation({
        mutationFn: async () => {
            const items = cart.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                priceAtSale: Number(item.sellingPrice),
            }))
            const res = await fetch(`/api/sales/${sale.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to update sale")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] })
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            toast.success("Sale updated successfully! / تم تحديث البيع بنجاح")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update sale / فشل تحديث البيع")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Edit Sale Record</span>
                        <span dir="rtl">تعديل سجل البيع</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Modify products or quantities for this sale. Stock will be reconciled automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
                    {/* Left: Product Selection */}
                    <div className="flex flex-col gap-4 min-h-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search products... / بحث..."
                                className="pl-10 bg-slate-950 border-slate-800 text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="flex-1 bg-slate-950/50 rounded-md border border-slate-800 p-2">
                            <div className="grid grid-cols-1 gap-2">
                                {products?.map((p) => (
                                    <Card
                                        key={p.id}
                                        className="bg-slate-900 border-slate-800 hover:border-blue-500 cursor-pointer transition-colors"
                                        onClick={() => addToCart(p)}
                                    >
                                        <CardContent className="p-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-sm text-white">{p.partName}</div>
                                                <div className="text-xs text-slate-500">{p.carBrand} {p.carModel}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-emerald-400 font-bold text-sm">{formatCurrency(p.sellingPrice)}</div>
                                                <div className="text-[10px] text-slate-500">Stock: {p.stockQuantity}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {products?.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm">No products found</div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right: Cart/Current Items */}
                    <div className="flex flex-col gap-4 min-h-0">
                        <div className="font-bold text-sm flex justify-between items-center bg-slate-800 p-2 rounded">
                            <span>Sale Items / القطع في العربة</span>
                            <span className="text-blue-400">{cart.length} items</span>
                        </div>
                        <ScrollArea className="flex-1 bg-slate-950/50 rounded-md border border-slate-800 p-2">
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-2 p-2 bg-slate-900 rounded border border-slate-800">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm font-medium text-white">{item.partName}</div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-red-500"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 text-white border-slate-700"
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 text-white border-slate-700"
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    disabled={item.quantity >= item.stockQuantity}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-emerald-400">
                                                    {formatCurrency(item.quantity * item.sellingPrice)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">Cart is empty</div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="bg-slate-950 p-4 rounded-md border border-slate-800 space-y-2">
                            <div className="flex justify-between text-slate-400 text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                            <Separator className="bg-slate-800" />
                            <div className="flex justify-between font-bold text-lg text-white">
                                <span>Total / الإجمالي</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-slate-400 font-bold"
                    >
                        Cancel / إلغاء
                    </Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12"
                        disabled={mutation.isPending || cart.length === 0}
                    >
                        {mutation.isPending ? "Updating..." : "Update Sale / تحديث البيع"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
