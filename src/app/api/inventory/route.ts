import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
    partName: z.string().min(1),
    category: z.string().min(1),
    carBrand: z.string().min(1),
    carModel: z.string().min(1),
    yearRange: z.string().min(1),
    stockQuantity: z.number().int().nonnegative(),
    costPrice: z.number().positive(),
    sellingPrice: z.number().positive(),
    binLocation: z.string().optional().nullable(),
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || undefined

    try {
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { partName: { contains: query, mode: 'insensitive' } },
                    { carBrand: { contains: query, mode: 'insensitive' } },
                    { carModel: { contains: query, mode: 'insensitive' } },
                ],
                category: category,
            },
            orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json(products)
    } catch (error) {
        console.error('Inventory GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validatedData = productSchema.parse(body)

        const product = await prisma.product.create({
            data: {
                ...validatedData,
                binLocation: validatedData.binLocation || null,
            },
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error('Inventory POST Error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
