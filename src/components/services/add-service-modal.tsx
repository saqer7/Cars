"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"

const serviceFormSchema = z.object({
    carPlateNumber: z.string().min(1, "Plate number is required / رقم اللوحة مطلوب"),
    customerName: z.string().min(1, "Customer name is required / اسم العميل مطلوب"),
    serviceType: z.string().min(1, "Service type is required / نوع الخدمة مطلوب"),
    technicianNotes: z.string().optional(),
    totalPrice: z.number().nonnegative(),
    partsUsed: z.array(z.object({
        productId: z.string().min(1, "Select a part / اختر قطعة"),
        quantity: z.number().int().positive(),
    })),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

interface AddServiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddServiceModal({ open, onOpenChange }: AddServiceModalProps) {
    const queryClient = useQueryClient()

    const { data: inventory } = useQuery({
        queryKey: ['inventory', 'all'],
        queryFn: async () => {
            const res = await fetch('/api/inventory')
            return res.json()
        }
    })

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            carPlateNumber: "",
            customerName: "",
            serviceType: "",
            technicianNotes: "",
            totalPrice: 0,
            partsUsed: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "partsUsed"
    })

    const mutation = useMutation({
        mutationFn: async (values: ServiceFormValues) => {
            const response = await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })
            if (!response.ok) throw new Error("Failed to create service")
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] })
            queryClient.invalidateQueries({ queryKey: ["records"] })
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            toast.success("Service record created! / تم تسجيل الخدمة بنجاح")
            onOpenChange(false)
            form.reset()
        },
        onError: () => {
            toast.error("Failed to save service / فشل حفظ السجل")
        },
    })

    function onSubmit(values: ServiceFormValues) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>New Service Record</span>
                        <span dir="rtl">سجل خدمة جديد</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 flex justify-between">
                        <span>Record a new repair or key coding job.</span>
                        <span dir="rtl">تسجيل عملية إصلاح أو برمجة مفتاح جديدة.</span>
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between">
                                                <FormLabel>Customer Name</FormLabel>
                                                <FormLabel dir="rtl">اسم العميل</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Input placeholder="e.g. Oday" {...field} className="bg-slate-950 border-slate-800 text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="carPlateNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between">
                                                <FormLabel>Plate Number</FormLabel>
                                                <FormLabel dir="rtl">رقم اللوحة</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Input placeholder="ABC-1234" {...field} className="bg-slate-950 border-slate-800 text-white uppercase" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="serviceType"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <FormLabel>Service Type</FormLabel>
                                            <FormLabel dir="rtl">نوع الخدمة</FormLabel>
                                        </div>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white border">
                                                    <SelectValue placeholder="Select type / اختر النوع" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="Key Duplication">Key Duplication / نسخ مفتاح</SelectItem>
                                                <SelectItem value="Key Coding">Key Coding / برمجة مفتاح</SelectItem>
                                                <SelectItem value="Window Motor Repair">Window Motor Repair / إصلاح موتور نافذة</SelectItem>
                                                <SelectItem value="Switch Replacement">Switch Replacement / تبديل سويتش</SelectItem>
                                                <SelectItem value="Remote Programming">Remote Programming / برمجة ريموت</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-slate-300">Parts Used</FormLabel>
                                        <span dir="rtl" className="text-xs text-slate-500">القطع المستخدمة</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ productId: "", quantity: 1 })}
                                        className="h-7 text-xs border-slate-700"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Part / إضافة قطعة
                                    </Button>
                                </div>

                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-end">
                                        <FormField
                                            control={form.control}
                                            name={`partsUsed.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white border">
                                                                <SelectValue placeholder="Select part / اختر قطعة" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                            {inventory?.map((p: any) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.partName} ({p.carBrand})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`partsUsed.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-20">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            className="bg-slate-950 border-slate-800 text-white"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="text-slate-500 hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <FormField
                                control={form.control}
                                name="technicianNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <FormLabel>Technician Notes</FormLabel>
                                            <FormLabel dir="rtl">ملاحظات الفني</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input placeholder="Repair details..." {...field} className="bg-slate-950 border-slate-800 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="totalPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <FormLabel>Total Price (ILS)</FormLabel>
                                            <FormLabel dir="rtl">السعر الإجمالي</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                className="bg-slate-950 border-slate-800 text-white text-lg font-bold"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="mt-6">
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? "Saving..." : "Save Record / حفظ السجل"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
