"use client"

import { useQuery } from "@tanstack/react-query"
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpDown,
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    ColumnDef
} from "@tanstack/react-table"

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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AddProductModal } from "@/components/inventory/add-product-modal"
import { EditProductModal } from "@/components/inventory/edit-product-modal"
import { AdjustStockModal } from "@/components/inventory/adjust-stock-modal"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"

import { formatCurrency } from "@/lib/utils"

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

function buildColumns(
    onEdit: (product: Product) => void,
    onAdjustStock: (product: Product) => void,
    onDelete: (product: Product) => void
): ColumnDef<Product>[] {
    return [
        {
            accessorKey: "partName",
            header: () => <div className="flex flex-col"><span>Product Name</span><span dir="rtl" className="text-xs opacity-70">اسم القطعة</span></div>,
            cell: ({ row }) => <div className="font-medium">{row.getValue("partName")}</div>,
        },
        {
            accessorKey: "carBrand",
            header: () => <div className="flex flex-col"><span>Brand</span><span dir="rtl" className="text-xs opacity-70">الماركة</span></div>,
        },
        {
            accessorKey: "carModel",
            header: () => <div className="flex flex-col"><span>Model</span><span dir="rtl" className="text-xs opacity-70">الموديل</span></div>,
        },
        {
            accessorKey: "category",
            header: () => <div className="flex flex-col"><span>Category</span><span dir="rtl" className="text-xs opacity-70">الفئة</span></div>,
            cell: ({ row }) => (
                <Badge variant="outline">{row.getValue("category")}</Badge>
            ),
        },
        {
            accessorKey: "yearRange",
            header: () => <div className="flex flex-col"><span>Years</span><span dir="rtl" className="text-xs opacity-70">السنوات</span></div>,
        },
        {
            accessorKey: "stockQuantity",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex flex-col items-start p-0 h-auto hover:bg-transparent"
                >
                    <div className="flex items-center">
                        Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                    <span dir="rtl" className="text-xs opacity-70">الكمية</span>
                </Button>
            ),
            cell: ({ row }) => {
                const stock = row.getValue("stockQuantity") as number
                return (
                    <div className="flex items-center gap-2">
                        {stock < 3 && <Badge variant="destructive" className="animate-pulse">Low Stock</Badge>}
                        <span className={stock < 3 ? "text-red-500 font-bold" : ""}>
                            {stock}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: "sellingPrice",
            header: () => <div className="flex flex-col"><span>Price</span><span dir="rtl" className="text-xs opacity-70">السعر</span></div>,
            cell: ({ row }) => formatCurrency(row.getValue("sellingPrice")),
        },
        {
            accessorKey: "binLocation",
            header: () => <div className="flex flex-col"><span>Bin</span><span dir="rtl" className="text-xs opacity-70">الموقع</span></div>,
            cell: ({ row }) => row.getValue("binLocation") || "-",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const product = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
                            <DropdownMenuLabel>Actions / إجراءات</DropdownMenuLabel>
                            <DropdownMenuItem
                                className="hover:bg-slate-800 cursor-pointer"
                                onSelect={() => onEdit(product)}
                            >
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="hover:bg-slate-800 cursor-pointer"
                                onSelect={() => onAdjustStock(product)}
                            >
                                Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem
                                className="text-red-500 hover:bg-slate-800 cursor-pointer"
                                onSelect={() => onDelete(product)}
                            >
                                Delete Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}

export default function InventoryPage() {
    const queryClient = useQueryClient()
    const [sorting, setSorting] = useState<SortingState>([])
    const [search, setSearch] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    const handleEdit = useCallback((product: Product) => {
        setSelectedProduct(product)
        setIsEditModalOpen(true)
    }, [])

    const handleAdjustStock = useCallback((product: Product) => {
        setSelectedProduct(product)
        setIsAdjustModalOpen(true)
    }, [])

    const handleDelete = useCallback((product: Product) => {
        setSelectedProduct(product)
        setIsDeleteDialogOpen(true)
    }, [])

    const confirmDelete = async () => {
        if (!selectedProduct) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/inventory/${selectedProduct.id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete")
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            toast.success("Item deleted / تم حذف القطعة")
            setIsDeleteDialogOpen(false)
        } catch {
            toast.error("Failed to delete item / فشل حذف القطعة")
        } finally {
            setIsDeleting(false)
            setSelectedProduct(null)
        }
    }

    const columns = useMemo(
        () => buildColumns(handleEdit, handleAdjustStock, handleDelete),
        [handleEdit, handleAdjustStock, handleDelete]
    )

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ['inventory', search],
        queryFn: async () => {
            const res = await fetch(`/api/inventory?q=${search}`)
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        }
    })

    const table = useReactTable({
        data: products || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex justify-between items-center w-full">
                        <span>Inventory Management</span>
                        <span dir="rtl">إدارة المخزون</span>
                    </h1>
                    <p className="text-slate-400 mt-1 flex justify-between items-center w-full">
                        <span>Manage your car parts and electronic components.</span>
                        <span dir="rtl">إدارة قطع السيارات والمكونات الإلكترونية.</span>
                    </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add New Item / إضافة قطعة</span>
                </Button>
            </div>

            <AddProductModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
            <EditProductModal
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open)
                    if (!open) setSelectedProduct(null)
                }}
                product={selectedProduct}
            />
            <AdjustStockModal
                open={isAdjustModalOpen}
                onOpenChange={(open) => {
                    setIsAdjustModalOpen(open)
                    if (!open) setSelectedProduct(null)
                }}
                product={selectedProduct}
            />

            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                isPending={isDeleting}
                title="Delete Product / حذف القطعة"
                description={`Are you sure you want to delete "${selectedProduct?.partName}"? This action cannot be undone. / هل أنت متأكد من حذف "${selectedProduct?.partName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
            />

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search inventory... / بحث في المخزون..."
                                className="pl-10 bg-slate-950 border-slate-800 text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="border-slate-800 text-white">
                            <Filter className="mr-2 h-4 w-4" /> Filter / تصفية
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800">
                        <Table>
                            <TableHeader className="bg-slate-950">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="border-slate-800 hover:bg-transparent">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="text-slate-400">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-slate-800">
                                            {columns.map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-6 w-full bg-slate-800" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="border-slate-800 hover:bg-slate-800/50 data-[state=selected]:bg-slate-800"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="text-slate-300">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4 text-slate-400">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-slate-800"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-slate-800"
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
