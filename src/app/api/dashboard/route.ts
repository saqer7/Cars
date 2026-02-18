import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns"
import { getJerusalemTodayRange, getJerusalemNow } from "@/lib/date-utils"

const LOW_STOCK_THRESHOLD = 3

export async function GET() {
  try {
    const { start: todayStart, end: todayEnd, yesterdayStart, yesterdayEnd, jNow } = getJerusalemTodayRange()

    // Daily revenue (Sales + Services for today)
    const [todaySales, todayServices, yesterdaySales, yesterdayServices] =
      await Promise.all([
        prisma.sale.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: { gte: todayStart, lte: todayEnd },
          },
          _sum: { totalAmount: true },
        }),
        prisma.serviceRecord.aggregate({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
          _sum: { totalPrice: true },
        }),
        prisma.sale.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          },
          _sum: { totalAmount: true },
        }),
        prisma.serviceRecord.aggregate({
          where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
          _sum: { totalPrice: true },
        }),
      ])

    const dailyRevenue =
      Number(todaySales._sum.totalAmount ?? 0) + Number(todayServices._sum.totalPrice ?? 0)
    const yesterdayRevenue =
      Number(yesterdaySales._sum.totalAmount ?? 0) +
      Number(yesterdayServices._sum.totalPrice ?? 0)
    const revenueChangePct =
      yesterdayRevenue > 0
        ? ((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : 0

    // Services completed today
    const todayServicesCount = await prisma.serviceRecord.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    })

    // Low stock items
    const lowStockCount = await prisma.product.count({
      where: { stockQuantity: { lte: LOW_STOCK_THRESHOLD } },
    })

    // Inventory value (cost price × stock)
    const products = await prisma.product.findMany({
      select: { costPrice: true, stockQuantity: true },
    })
    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.costPrice) * p.stockQuantity,
      0
    )

    // Total expenses (today and overall for net)
    let dailyExpenses = 0
    let allTimeExpenses = 0
    try {
      const [todayExpenses, totalExpenses] = await Promise.all([
        prisma.expense.aggregate({
          where: { expenseDate: { gte: todayStart, lte: todayEnd } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
        }),
      ])
      dailyExpenses = Number(todayExpenses._sum.amount ?? 0)
      allTimeExpenses = Number(totalExpenses._sum.amount ?? 0)
    } catch {
      // Expense table may not exist before migration
    }

    // Revenue trends (last 7 days)
    const revenueByDay = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const day = subDays(jNow, 6 - i)
        const dayStart = startOfDay(day)
        const dayEnd = endOfDay(day)

        // Note: For the chart, we can be slightly less precise about the exact UTC moment 
        // as long as the days are consistent, but for today/yesterday metrics we were exact above.
        // Let's stick to the same logic for consistency in the trend.

        const [daySales, dayServices] = await Promise.all([
          prisma.sale.aggregate({
            where: {
              status: "COMPLETED",
              createdAt: { gte: dayStart, lte: dayEnd },
            },
            _sum: { totalAmount: true },
          }),
          prisma.serviceRecord.aggregate({
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
            _sum: { totalPrice: true },
          }),
        ])
        const revenue =
          Number(daySales._sum.totalAmount ?? 0) +
          Number(dayServices._sum.totalPrice ?? 0)
        return {
          name: format(day, "EEE"),
          revenue,
        }
      })
    )

    // Recent activity: mix of services and sales, ordered by createdAt desc
    const [recentServices, recentSales] = await Promise.all([
      prisma.serviceRecord.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      prisma.sale.findMany({
        where: { status: "COMPLETED" },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ])

    const recentActivity = [
      ...recentServices.map((s) => ({
        id: s.id,
        type: "service" as const,
        action: s.serviceType,
        car: `${s.customerName} - ${s.carPlateNumber}`,
        price: Number(s.totalPrice),
        time: s.createdAt,
      })),
      ...recentSales.map((s) => ({
        id: s.id,
        type: "sale" as const,
        action: "Sale",
        car: "",
        price: Number(s.totalAmount),
        time: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)

    return NextResponse.json({
      dailyRevenue,
      revenueChangePct,
      servicesCompleted: todayServicesCount,
      lowStockCount,
      inventoryValue,
      dailyExpenses,
      totalExpenses: allTimeExpenses,
      revenueByDay,
      recentActivity,
    })
  } catch (error) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
