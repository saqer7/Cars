"use client"

import React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps {
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen p-6 bg-slate-950">
                    <Card className="max-w-md w-full border-red-900/50 bg-slate-900 text-white shadow-2xl">
                        <CardHeader className="space-y-1">
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertTriangle className="h-6 w-6" />
                                <CardTitle className="text-2xl">System Error</CardTitle>
                            </div>
                            <p className="text-slate-400" dir="rtl">حدث خطأ في النظام</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-300">
                                Something went wrong while processing your request. This error has been logged.
                            </p>
                            <div className="bg-black/40 p-3 rounded text-xs font-mono text-red-400 overflow-auto max-h-32">
                                {this.state.error?.message || "Unknown error"}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={this.handleRetry}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Try Again / حاول مجدداً
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
