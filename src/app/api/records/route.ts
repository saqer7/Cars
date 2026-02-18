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

export async function GET() {
    try {
        const [services, sales, expenses] = await Promise.all([
            prisma.serviceRecord.findMany({
                include: { partsUsed: { include: { product: true } } },
                orderBy: { createdAt: "desc" },
            }),
            prisma.sale.findMany({
                where: { status: "COMPLETED" },
                include: { items: { include: { product: true } } },
                orderBy: { createdAt: "desc" },
            }),
            (prisma as any).expense.findMany({
                orderBy: { expenseDate: "desc" },
            }),
        ])

        const serviceRecords: UnifiedRecord[] = (services as any[]).map((s) => ({
            id: s.id,
            type: "service" as const,
            createdAt: s.createdAt.toISOString(),
            totalAmount: Number(s.totalPrice),
            customerName: s.customerName,
            carPlateNumber: s.carPlateNumber,
            serviceType: s.serviceType,
            items: (s.partsUsed as any[]).map((p) => ({
                name: p.product.partName,
                quantity: p.quantity,
            })),
        }))

        const saleRecords: UnifiedRecord[] = (sales as any[]).map((s) => ({
            id: s.id,
            type: "sale" as const,
            createdAt: s.createdAt.toISOString(),
            totalAmount: Number(s.totalAmount),
            customerName: null,
            carPlateNumber: null,
            serviceType: null,
            items: (s.items as any[]).map((i) => ({
                name: i.product.partName,
                quantity: i.quantity,
            })),
        }))

        const expenseRecords: UnifiedRecord[] = (expenses as any[]).map((e) => ({
            id: e.id,
            type: "expense" as const,
            createdAt: e.expenseDate.toISOString(),
            totalAmount: Number(e.amount),
            customerName: null,
            carPlateNumber: null,
            serviceType: null,
            expenseType: e.type,
            description: e.description,
            items: [],
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
