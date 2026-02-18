import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const saleItemSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    priceAtSale: z.number().positive(),
})

const saleSchema = z.object({
    items: z.array(saleItemSchema).min(1),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validatedData = saleSchema.parse(body)

        const subtotal = validatedData.items.reduce(
            (sum, item) => sum + item.quantity * item.priceAtSale,
            0
        )
        const taxAmount = 0
        const totalAmount = subtotal + taxAmount

        // Verify stock availability
        for (const item of validatedData.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })
            if (!product) {
                return NextResponse.json(
                    { error: `Product not found: ${item.productId}` },
                    { status: 400 }
                )
            }
            if (product.stockQuantity < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Insufficient stock for ${product.partName}. Available: ${product.stockQuantity}`,
                    },
                    { status: 400 }
                )
            }
        }

        const sale = await prisma.$transaction(async (tx) => {
            const newSale = await tx.sale.create({
                data: {
                    totalAmount,
                    taxAmount,
                    status: "COMPLETED",
                    items: {
                        create: validatedData.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtSale: item.priceAtSale,
                        })),
                    },
                },
                include: { items: true },
            })

            for (const item of validatedData.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } },
                })
            }

            return newSale
        })

        return NextResponse.json(sale, { status: 201 })
    } catch (error) {
        console.error("Sales POST Error:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json(
            { error: "Failed to create sale" },
            { status: 500 }
        )
    }
}
