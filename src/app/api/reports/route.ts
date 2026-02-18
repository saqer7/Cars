import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const months = parseInt(searchParams.get("months") || "6", 10)

  try {
    const now = new Date()

    // Monthly sales and expenses
    const monthlyData = await Promise.all(
      Array.from({ length: months }, async (_, i) => {
        const monthDate = subMonths(now, months - 1 - i)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)
        const [sales, services, expenses] = await Promise.all([
          prisma.sale.aggregate({
            where: {
              status: "COMPLETED",
              createdAt: { gte: monthStart, lte: monthEnd },
            },
            _sum: { totalAmount: true },
          }),
          prisma.serviceRecord.aggregate({
            where: { createdAt: { gte: monthStart, lte: monthEnd } },
            _sum: { totalPrice: true },
          }),
          prisma.expense.aggregate({
            where: { expenseDate: { gte: monthStart, lte: monthEnd } },
            _sum: { amount: true },
          }).catch(() => ({ _sum: { amount: 0 } })),
        ])
        const revenue =
          Number(sales._sum.totalAmount ?? 0) +
          Number(services._sum.totalPrice ?? 0)
        const expenseTotal = Number(expenses._sum.amount ?? 0)
        return {
          name: format(monthDate, "MMM"),
          sales: revenue,
          expenses: expenseTotal,
          net: revenue - expenseTotal,
        }
      })
    )

    // Inventory distribution by category
    const products = await prisma.product.findMany({
      select: { category: true, stockQuantity: true, costPrice: true },
    })
    const byCategory = products.reduce(
      (acc, p) => {
        const cat = p.category || "Other"
        if (!acc[cat]) acc[cat] = { count: 0, value: 0 }
        acc[cat].count += p.stockQuantity
        acc[cat].value += Number(p.costPrice) * p.stockQuantity
        return acc
      },
      {} as Record<string, { count: number; value: number }>
    )
    const inventoryDistribution = Object.entries(byCategory).map(
      ([category, data]) => ({
        name: category,
        count: data.count,
        value: data.value,
      })
    )

    return NextResponse.json({
      monthlyData,
      monthlySales: monthlyData.map((d) => ({ name: d.name, sales: d.sales })),
      monthlyExpenses: monthlyData.map((d) => ({ name: d.name, expenses: d.expenses })),
      inventoryDistribution,
    })
  } catch (error) {
    console.error("Reports API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    )
  }
}
