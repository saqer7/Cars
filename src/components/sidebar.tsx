"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    PlusCircle,
    Wrench,
    FileText,
    Settings,
    Menu,
    Receipt
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
    { name: "Dashboard", arName: "لوحة التحكم", href: "/", icon: LayoutDashboard },
    { name: "Inventory", arName: "المخزون", href: "/inventory", icon: Package },
    { name: "New Sale", arName: "بيع جديد", href: "/sales/new", icon: PlusCircle, highlight: true },
    { name: "Records", arName: "السجلات", href: "/services", icon: Wrench },
    { name: "Expenses", arName: "المصاريف", href: "/expenses", icon: Receipt },
    { name: "Reports", arName: "تقارير", href: "/reports", icon: FileText },
]

export function Sidebar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const NavContent = () => (
        <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-slate-300">
            <div className="p-6">
                <h1 className="text-xl font-bold text-white flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        AutoLock ERP
                    </div>
                    <span dir="rtl" className="text-sm text-blue-500 mr-10 font-medium">إدارة محل زينة السيارات</span>
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-md transition-all group",
                            pathname === item.href
                                ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/20"
                                : item.highlight
                                    ? "bg-slate-900/50 border border-blue-500/30 text-blue-400 hover:bg-slate-900 hover:text-white"
                                    : "hover:bg-slate-900 hover:text-white"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-blue-500")} />
                            <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span dir="rtl" className={cn("text-xs opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap", pathname === item.href ? "text-white" : "text-slate-400")}>
                            {item.arName}
                        </span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center uppercase tracking-widest">
                &copy; 2024 AutoLock ERP - Car Accessories
            </div>
        </div>
    )

    return (
        <>
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <NavContent />
            </aside>

            <div className="md:hidden p-4 flex items-center justify-between bg-slate-950 border-b border-slate-800 fixed top-0 w-full z-50">
                <h1 className="text-lg font-bold text-white">AutoLock ERP</h1>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-0">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
