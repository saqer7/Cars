import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const serviceSchema = z.object({
    carPlateNumber: z.string().min(1),
    customerName: z.string().min(1),
    serviceType: z.string().min(1),
    technicianNotes: z.string().optional(),
    totalPrice: z.number().positive(),
    partsUsed: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive()
    })).optional().default([]),
})

export async function GET() {
    try {
        const services = await prisma.serviceRecord.findMany({
            include: { partsUsed: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json(services)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validatedData = serviceSchema.parse(body)

        // Fetch products to get current prices for ServicePart records
        const productIds = validatedData.partsUsed.map(p => p.productId)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        })

        const productMap = new Map<string, typeof products[0]>(
            products.map((p: (typeof products)[0]) => [p.id, p])
        )

        const service = await prisma.serviceRecord.create({
            data: {
                carPlateNumber: validatedData.carPlateNumber,
                customerName: validatedData.customerName,
                serviceType: validatedData.serviceType,
                technicianNotes: validatedData.technicianNotes,
                totalPrice: validatedData.totalPrice,
                partsUsed: {
                    create: validatedData.partsUsed.map(part => {
                        const product = productMap.get(part.productId)
                        return {
                            productId: part.productId,
                            quantity: part.quantity,
                            priceAtSale: product?.sellingPrice || 0
                        }
                    })
                }
            },
            include: { partsUsed: true }
        })

        // Update stock levels for used parts
        for (const part of validatedData.partsUsed) {
            await prisma.product.update({
                where: { id: part.productId },
                data: { stockQuantity: { decrement: part.quantity } }
            })
        }

        return NextResponse.json(service, { status: 201 })
    } catch (error) {
        console.error(error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create service record' }, { status: 500 })
    }
}
