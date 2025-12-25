"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface LoanCountdownProps {
    dueDate: string | Date
}

export function LoanCountdown({ dueDate }: LoanCountdownProps) {
    const [timeLeft, setTimeLeft] = useState("")
    const [isOverdue, setIsOverdue] = useState(false)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(dueDate).getTime() - new Date().getTime()

            if (difference < 0) {
                setIsOverdue(true)
                setTimeLeft("Overdue")
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
            const minutes = Math.floor((difference / 1000 / 60) % 60)

            setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

        return () => clearInterval(timer)
    }, [dueDate])

    return (
        <div className={`flex items-center space-x-2 text-sm font-medium ${isOverdue ? "text-destructive" : "text-primary"}`}>
            <Clock className="h-4 w-4" />
            <span>{isOverdue ? "Overdue" : `${timeLeft} remaining`}</span>
        </div>
    )
}
