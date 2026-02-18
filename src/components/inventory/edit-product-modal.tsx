"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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
    partName: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().min(1, "Select a category"),
    carBrand: z.string().min(1, "Enter car brand"),
    carModel: z.string().min(1, "Enter car model"),
    yearRange: z.string().min(1, "Enter year range"),
    costPrice: z.number().min(0, "Price cannot be negative"),
    sellingPrice: z.number().min(0, "Price cannot be negative"),
    binLocation: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Product {
    id: string
    partName: string
    category: string
    carBrand: string
    carModel: string
    yearRange: string
    stockQuantity: number
    costPrice: number
    sellingPrice: number
    binLocation: string | null
}

interface EditProductModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product | null
}

export function EditProductModal({ open, onOpenChange, product }: EditProductModalProps) {
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            partName: "",
            category: "",
            carBrand: "",
            carModel: "",
            yearRange: "",
            costPrice: 0,
            sellingPrice: 0,
            binLocation: "",
        },
    })

    useEffect(() => {
        if (product) {
            form.reset({
                partName: product.partName,
                category: product.category,
                carBrand: product.carBrand,
                carModel: product.carModel,
                yearRange: product.yearRange,
                costPrice: Number(product.costPrice),
                sellingPrice: Number(product.sellingPrice),
                binLocation: product.binLocation || "",
            })
        }
    }, [product, form])

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            if (!product) throw new Error("No product selected")
            const response = await fetch(`/api/inventory/${product.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    binLocation: values.binLocation || null,
                }),
            })
            if (!response.ok) throw new Error("Failed to update product")
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            toast.success("Product updated!")
            onOpenChange(false)
        },
        onError: () => {
            toast.error("Failed to update")
        },
    })

    function onSubmit(values: FormValues) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Product / تعديل القطعة</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update product details. Stock is adjusted separately.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="partName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-950 border-slate-800 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="Switches">Switches</SelectItem>
                                                <SelectItem value="Motors">Motors</SelectItem>
                                                <SelectItem value="Keys">Keys</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="carBrand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Car Brand</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-slate-950 border-slate-800 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="carModel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Car Model</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-slate-950 border-slate-800 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="yearRange"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Year Range</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-slate-950 border-slate-800 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="costPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost (ILS)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                value={field.value ?? ""}
                                                className="bg-slate-950 border-slate-800 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sellingPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Selling Price (ILS)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                value={field.value ?? ""}
                                                className="bg-slate-950 border-slate-800 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="binLocation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bin (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-950 border-slate-800 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {product && (
                            <p className="text-sm text-slate-500">
                                Current stock: {product.stockQuantity}. Use Adjust Stock to change.
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
