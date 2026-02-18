import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
    partName: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    carBrand: z.string().min(1).optional(),
    carModel: z.string().min(1).optional(),
    yearRange: z.string().min(1).optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    costPrice: z.number().positive().optional(),
    sellingPrice: z.number().positive().optional(),
    binLocation: z.string().optional().nullable(),
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = productSchema.parse(body)

        const product = await prisma.product.update({
            where: { id },
            data: validatedData,
        })

        return NextResponse.json(product)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.product.delete({
            where: { id },
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
