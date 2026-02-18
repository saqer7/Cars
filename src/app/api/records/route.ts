import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export type RecordType = "service" | "sale" | "expense"

export interface UnifiedRecord {
    id: string
    type: RecordType
    createdAt: string
    totalAmount: number
    // Service fields (null for others)
    customerName: string | null
    carPlateNumber: string | null
    serviceType: string | null
    // Expense fields
    expenseType?: string | null
    description?: string | null
    items: { name: string; quantity: number }[]
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const whereDate: any = {}
    if (from || to) {
        whereDate.createdAt = {}
        if (from) whereDate.createdAt.gte = new Date(from)
        if (to) whereDate.createdAt.lte = new Date(to)
    }

    const expenseWhereDate: any = {}
    if (from || to) {
        expenseWhereDate.expenseDate = {}
        if (from) expenseWhereDate.expenseDate.gte = new Date(from)
        if (to) expenseWhereDate.expenseDate.lte = new Date(to)
    }

    try {
        const [services, sales, expenses] = await Promise.all([
            prisma.serviceRecord.findMany({
                where: from || to ? {
                    createdAt: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(to) } : {})
                    }
                } : {},
                include: { partsUsed: { include: { product: true } } },
                orderBy: { createdAt: "desc" },
            }),
            prisma.sale.findMany({
                where: {
                    status: "COMPLETED",
                    ...(from || to ? {
                        createdAt: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {})
                        }
                    } : {})
                },
                include: { items: { include: { product: true } } },
                orderBy: { createdAt: "desc" },
            }),
            (prisma as any).expense.findMany({
                where: from || to ? {
                    expenseDate: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(to) } : {})
                    }
                } : {},
                orderBy: { expenseDate: "desc" },
            }),
        ])

        const serviceRecords: any[] = (services as any[]).map((s) => ({
            id: s.id,
            type: "service" as const,
            title: `Service: ${s.serviceType}`,
            description: `${s.customerName} - ${s.carPlateNumber}`,
            createdAt: s.createdAt.toISOString(),
            totalAmount: Number(s.totalPrice),
            items: (s.partsUsed as any[]).map((p) => ({
                name: p.product.partName,
                quantity: p.quantity,
            })),
            rawService: s,
        }))

        const saleRecords: any[] = (sales as any[]).map((s) => ({
            id: s.id,
            type: "sale" as const,
            title: "Point of Sale",
            description: `${(s.items as any[]).length} items sold`,
            createdAt: s.createdAt.toISOString(),
            totalAmount: Number(s.totalAmount),
            items: (s.items as any[]).map((i) => ({
                name: i.product.partName,
                quantity: i.quantity,
            })),
            rawSale: s,
        }))

        const expenseRecords: any[] = (expenses as any[]).map((e) => ({
            id: e.id,
            type: "expense" as const,
            title: `Expense: ${e.type}`,
            description: e.description,
            createdAt: e.expenseDate.toISOString(),
            totalAmount: Number(e.amount),
            items: [],
            rawExpense: e,
        }))

        const combined = [...serviceRecords, ...saleRecords, ...expenseRecords].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return NextResponse.json(combined)
    } catch (error) {
        console.error("Records API Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch records" },
            { status: 500 }
        )
    }
}
