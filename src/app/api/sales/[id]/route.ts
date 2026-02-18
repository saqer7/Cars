import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const saleItemSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    priceAtSale: z.number().positive(),
})

const saleUpdateSchema = z.object({
    items: z.array(saleItemSchema).min(1),
})

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: { items: { include: { product: true } } },
        })

        if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        return NextResponse.json(sale)
    } catch (error) {
        console.error("Sale GET Error:", error)
        return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = saleUpdateSchema.parse(body)

        // 1. Get current sale with items
        const currentSale = await prisma.sale.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!currentSale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        const subtotal = validatedData.items.reduce(
            (sum, item) => sum + item.quantity * item.priceAtSale,
            0
        )
        const taxAmount = 0 // Assuming 0 for now as per original create logic
        const totalAmount = subtotal + taxAmount

        // 2. Perform transaction
        const result = await prisma.$transaction(async (tx) => {
            // Revert inventory from old items
            for (const oldItem of currentSale.items) {
                await tx.product.update({
                    where: { id: oldItem.productId },
                    data: { stockQuantity: { increment: oldItem.quantity } }
                })
            }

            // Delete old items
            await tx.saleItem.deleteMany({
                where: { saleId: id }
            })

            // Update sale record
            const updatedSale = await tx.sale.update({
                where: { id },
                data: {
                    totalAmount,
                    taxAmount,
                    items: {
                        create: validatedData.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtSale: item.priceAtSale
                        }))
                    }
                },
                include: { items: true }
            })

            // Apply new inventory changes
            for (const newItem of validatedData.items) {
                // Check stock (after revert)
                const product = await tx.product.findUnique({
                    where: { id: newItem.productId },
                    select: { stockQuantity: true, partName: true }
                })

                if (!product || product.stockQuantity < newItem.quantity) {
                    throw new Error(`Insufficient stock for ${product?.partName || 'product'}. Available: ${product?.stockQuantity || 0}`)
                }

                await tx.product.update({
                    where: { id: newItem.productId },
                    data: { stockQuantity: { decrement: newItem.quantity } }
                })
            }

            return updatedSale
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error("Sale PATCH Error:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : 'Failed to update sale'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            })

            if (sale) {
                // Revert inventory
                for (const item of sale.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { increment: item.quantity } }
                    })
                }

                // Delete items manually (if cascade not set/reliable)
                await tx.saleItem.deleteMany({
                    where: { saleId: id }
                })

                await tx.sale.delete({
                    where: { id }
                })
            }
        })

        return NextResponse.json({ message: "Sale deleted" })
    } catch (error) {
        console.error("Sale DELETE Error:", error)
        return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 })
    }
}
