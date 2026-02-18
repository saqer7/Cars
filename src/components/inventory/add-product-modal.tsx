"use client"

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
    DialogFooter
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
    stockQuantity: z.number().min(0, "Stock cannot be negative"),
    costPrice: z.number().min(0, "Price cannot be negative"),
    sellingPrice: z.number().min(0, "Price cannot be negative"),
    binLocation: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddProductModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            partName: "",
            category: "",
            carBrand: "",
            carModel: "",
            yearRange: "",
            stockQuantity: 0,
            costPrice: 0,
            sellingPrice: 0,
            binLocation: "",
        },
    })

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const response = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })
            if (!response.ok) throw new Error("Failed to create product")
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            toast.success("Product added successfully! / تم إضافة المنتج بنجاح")
            onOpenChange(false)
            form.reset()
        },
        onError: () => {
            toast.error("Something went wrong. / حدث خطأ ما")
        },
    })

    function onSubmit(values: FormValues) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Add New Inventory Item</span>
                        <span dir="rtl">إضافة قطعة جديدة</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 flex justify-between">
                        <span>Enter the details for the new car part or key.</span>
                        <span dir="rtl">أدخل تفاصيل القطعة أو المفتاح الجديد.</span>
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="partName"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between">
                                        <FormLabel>Product Name</FormLabel>
                                        <FormLabel dir="rtl">اسم القطعة</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Input placeholder="e.g. Master Window Switch" {...field} className="bg-slate-950 border-slate-800 text-white" />
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
                                        <div className="flex justify-between">
                                            <FormLabel>Category</FormLabel>
                                            <FormLabel dir="rtl">الفئة</FormLabel>
                                        </div>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white border">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="Switches">Switches / سويتات</SelectItem>
                                                <SelectItem value="Motors">Motors / موطورات</SelectItem>
                                                <SelectItem value="Keys">Keys / مفاتيح</SelectItem>
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
                                        <div className="flex justify-between">
                                            <FormLabel>Car Brand</FormLabel>
                                            <FormLabel dir="rtl">ماركة السيارة</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input placeholder="e.g. Toyota" {...field} className="bg-slate-950 border-slate-800 text-white" />
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
                                        <div className="flex justify-between">
                                            <FormLabel>Car Model</FormLabel>
                                            <FormLabel dir="rtl">موديل السيارة</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input placeholder="e.g. Camry" {...field} className="bg-slate-950 border-slate-800 text-white" />
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
                                        <div className="flex justify-between">
                                            <FormLabel>Year Range</FormLabel>
                                            <FormLabel dir="rtl">سنة الصنع</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input placeholder="e.g. 2015-2022" {...field} className="bg-slate-950 border-slate-800 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="stockQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <FormLabel>Stock</FormLabel>
                                            <FormLabel dir="rtl">الكمية</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                className="bg-slate-950 border-slate-800 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="costPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <FormLabel>Cost (ILS)</FormLabel>
                                            <FormLabel dir="rtl">التكلفة</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                        <div className="flex justify-between">
                                            <FormLabel>Selling (ILS)</FormLabel>
                                            <FormLabel dir="rtl">البيع</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                    <div className="flex justify-between">
                                        <FormLabel>Bin (Optional)</FormLabel>
                                        <FormLabel dir="rtl">موقع التخزين</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Input placeholder="e.g. A-12" {...field} className="bg-slate-950 border-slate-800 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-6">
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Adding..." : "Add Item / إضافة قطعة"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
