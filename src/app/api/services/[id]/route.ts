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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const service = await prisma.serviceRecord.findUnique({
            where: { id },
            include: { partsUsed: { include: { product: true } } },
        })
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        return NextResponse.json(service)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = serviceSchema.parse(body)

        // 1. Get current service record with its parts
        const currentService = await prisma.serviceRecord.findUnique({
            where: { id },
            include: { partsUsed: true }
        })

        if (!currentService) {
            return NextResponse.json({ error: 'Service record not found' }, { status: 404 })
        }

        // 2. Perform transaction to update service and reconcile inventory
        const result = await prisma.$transaction(async (tx) => {
            // Revert inventory changes from old parts
            for (const oldPart of currentService.partsUsed) {
                await tx.product.update({
                    where: { id: oldPart.productId },
                    data: { stockQuantity: { increment: oldPart.quantity } }
                })
            }

            // Delete old parts relations
            await tx.servicePart.deleteMany({
                where: { serviceId: id }
            })

            // Fetch new products to get current prices
            const productIds = validatedData.partsUsed.map(p => p.productId)
            const products = await tx.product.findMany({
                where: { id: { in: productIds } }
            })

            const productMap = new Map(products.map(p => [p.id, p]))

            // Update service record and create new parts relations
            const updatedService = await tx.serviceRecord.update({
                where: { id },
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

            // Apply new inventory changes
            for (const newPart of validatedData.partsUsed) {
                // Check if we have enough stock (after revert)
                const currentProduct = await tx.product.findUnique({
                    where: { id: newPart.productId },
                    select: { stockQuantity: true, partName: true }
                })

                if (!currentProduct || currentProduct.stockQuantity < newPart.quantity) {
                    throw new Error(`Insufficient stock for ${currentProduct?.partName || 'product'}. Available: ${currentProduct?.stockQuantity || 0}`)
                }

                await tx.product.update({
                    where: { id: newPart.productId },
                    data: { stockQuantity: { decrement: newPart.quantity } }
                })
            }

            return updatedService
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error(error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : 'Failed to update service record'
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
            const service = await tx.serviceRecord.findUnique({
                where: { id },
                include: { partsUsed: true }
            })

            if (service) {
                // Revert inventory
                for (const part of service.partsUsed) {
                    await tx.product.update({
                        where: { id: part.productId },
                        data: { stockQuantity: { increment: part.quantity } }
                    })
                }

                // Parts will be deleted by cascade if configured, 
                // but since Prisma schema doesn't show onDelete: Cascade, 
                // we delete manually.
                await tx.servicePart.deleteMany({
                    where: { serviceId: id }
                })

                await tx.serviceRecord.delete({
                    where: { id }
                })
            }
        })

        return NextResponse.json({ message: "Service record deleted" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to delete service record' }, { status: 500 })
    }
}
