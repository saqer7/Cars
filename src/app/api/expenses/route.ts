import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const expenseSchema = z.object({
    type: z.enum(["PARTS", "SERVICE", "RENT", "UTILITIES", "OTHER"]),
    description: z.string().min(1),
    amount: z.number().positive(),
    expenseDate: z.string().optional(),
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    try {
        const where: { expenseDate?: { gte?: Date; lte?: Date } } = {}
        if (from) where.expenseDate = { ...where.expenseDate, gte: new Date(from) }
        if (to) where.expenseDate = { ...where.expenseDate, lte: new Date(to) }

        const expenses = await prisma.expense.findMany({
            where: from || to ? where : undefined,
            orderBy: { expenseDate: "desc" },
        })
        return NextResponse.json(expenses)
    } catch (error) {
        console.error("Expenses GET Error:", error)
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validated = expenseSchema.parse(body)

        const expense = await prisma.expense.create({
            data: {
                type: validated.type,
                description: validated.description,
                amount: validated.amount,
                expenseDate: validated.expenseDate ? new Date(validated.expenseDate) : new Date(),
            },
        })
        return NextResponse.json(expense, { status: 201 })
    } catch (error) {
        console.error("Expenses POST Error:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
    }
}
