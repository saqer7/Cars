"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Search,
    ShoppingCart,
    Printer,
    Plus,
    Minus,
    Save
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

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

interface CartItem extends Product {
    quantity: number
}

export default function POSPage() {
    const [search, setSearch] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const queryClient = useQueryClient()

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ['inventory', 'pos', search],
        queryFn: async () => {
            const res = await fetch(`/api/inventory?q=${search}`)
            return res.json()
        }
    })

    const addToCart = (product: Product) => {
        if (product.stockQuantity <= 0) {
            toast.error("Item out of stock / القطعة غير متوفرة")
            return
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
                        : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
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

    const handleSaveSale = async () => {
        if (cart.length === 0) return
        setIsProcessing(true)

        try {
            const items = cart.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                priceAtSale: Number(item.sellingPrice),
            }))
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const msg = typeof data.error === "string"
                    ? data.error
                    : Array.isArray(data.error)
                        ? data.error.map((e: { message?: string }) => e.message).join(", ")
                        : "Failed to save sale"
                throw new Error(msg)
            }
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            toast.success("Sale saved successfully! / تم حفظ البيع بنجاح")
            setCart([])
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save sale"
            toast.error(`${message} / فشل حفظ البيع`)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className={`flex flex-col gap-6 min-h-0 ${cart.length > 0 ? "pb-24" : ""}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
                        <span>Point of Sale</span>
                        <span dir="rtl">نقطة البيع</span>
                    </h1>
                    <p className="text-slate-400 flex justify-between items-center w-full">
                        <span>Checkout parts or services quickly.</span>
                        <span dir="rtl">إتمام عملية البيع بسرعة للقطع والخدمات.</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Product Selection */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search inventory... / بحث في المخزون..."
                                    className="pl-10 bg-slate-950 border-slate-800 text-white"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                                    {isLoading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <Card key={i} className="bg-slate-950 border-slate-800 h-32 animate-pulse" />
                                        ))
                                    ) : products?.map((p) => (
                                        <Card
                                            key={p.id}
                                            className={`bg-slate-950 border-slate-800 hover:border-blue-500 transition-colors cursor-pointer group ${p.stockQuantity <= 0 ? 'opacity-50 grayscale' : ''}`}
                                            onClick={() => addToCart(p)}
                                        >
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-white line-clamp-1">{p.partName}</h3>
                                                        <p className="text-sm text-slate-400">{p.carBrand} {p.carModel}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-emerald-400 font-bold">{formatCurrency(p.sellingPrice)}</div>
                                                        <div className={`text-xs ${p.stockQuantity < 3 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                                                            Stock: {p.stockQuantity}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-[10px] text-slate-500 flex gap-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-800">{p.category}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-800">{p.yearRange}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {!isLoading && products?.length === 0 && (
                                        <div className="col-span-full h-32 flex flex-col items-center justify-center text-slate-500">
                                            <Search className="w-8 h-8 mb-2 opacity-20" />
                                            <p>No products found / لم يتم العثور على قطع</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Cart / Checkout */}
                <div className="lg:col-span-1 flex flex-col h-full">
                    <Card className="bg-slate-900 border-slate-800 flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="border-b border-slate-800 bg-slate-950/50">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                                    <CardTitle className="text-white">Cart</CardTitle>
                                </div>
                                <span dir="rtl" className="text-sm font-bold text-blue-500">العربة</span>
                            </div>
                            <CardDescription className="text-slate-400 flex justify-between">
                                <span>{cart.length} items selected</span>
                                <span dir="rtl">{cart.length} قطع مختارة</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-white line-clamp-1">{item.partName}</h4>
                                                <p className="text-xs text-slate-400">{formatCurrency(item.sellingPrice)} each</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 text-white border-slate-700 hover:bg-slate-800"
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 text-white border-slate-700 hover:bg-slate-800"
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    disabled={item.quantity >= item.stockQuantity}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-sm font-bold text-white">
                                                    {formatCurrency(item.quantity * Number(item.sellingPrice))}
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-[10px] text-destructive hover:underline"
                                                >
                                                    Remove / إزالة
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {cart.length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center text-slate-500 opacity-50">
                                            <ShoppingCart className="w-12 h-12 mb-2" />
                                            <p>Cart is empty / العربة فارغة</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex-col gap-4 border-t border-slate-800 bg-slate-950/50 p-6">
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Subtotal / المجموع الفرعي</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Tax (0%) / الضريبة</span>
                                    <span>{formatCurrency(0)}</span>
                                </div>
                                <Separator className="bg-slate-800" />
                                <div className="flex justify-between text-lg font-bold text-white">
                                    <span>Total / الإجمالي</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className="border-slate-800 h-12 text-white"
                                    disabled={cart.length === 0}
                                >
                                    <Printer className="w-4 h-4 mr-2" /> Print / طباعة
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 h-12 text-white font-bold"
                                    disabled={cart.length === 0 || isProcessing}
                                    onClick={handleSaveSale}
                                >
                                    {isProcessing ? "..." : <><Save className="w-4 h-4 mr-2" /> Save Sale / حفظ البيع</>}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Sticky Save bar - always visible when cart has items (fixes footer being off-screen) */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:left-64 z-50 flex items-center justify-between gap-4 p-4 bg-slate-900/95 border-t border-slate-800 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
                    <div className="font-bold text-white">
                        Total: {formatCurrency(total)} ({cart.length} item{cart.length !== 1 ? "s" : ""})
                    </div>
                    <Button
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
                        disabled={isProcessing}
                        onClick={handleSaveSale}
                    >
                        {isProcessing ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Sale / حفظ البيع</>}
                    </Button>
                </div>
            )}
        </div>
    )
}
