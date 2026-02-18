import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const expenseSchema = z.object({
    type: z.enum(["PARTS", "SERVICE", "RENT", "UTILITIES", "OTHER"]),
    description: z.string().min(1),
    amount: z.number().positive(),
    expenseDate: z.string().optional(),
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const validated = expenseSchema.parse(body)

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                type: validated.type,
                description: validated.description,
                amount: validated.amount,
                expenseDate: validated.expenseDate ? new Date(validated.expenseDate) : undefined,
            },
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error("Expense PATCH Error:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.expense.delete({
            where: { id },
        })
        return NextResponse.json({ message: "Expense deleted" })
    } catch (error) {
        console.error("Expense DELETE Error:", error)
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
    }
}
