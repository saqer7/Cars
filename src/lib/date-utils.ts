import { startOfDay, endOfDay, subDays } from "date-fns"

/**
 * Gets the current time in Jerusalem as a Date object.
 * Useful for calculating "Today" relative to Jerusalem wall-clock.
 */
export function getJerusalemNow(): Date {
    const now = new Date()
    // Convert to Jerusalem string and back to Date to get "local" digits
    const jerusalemString = now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
    return new Date(jerusalemString)
}

/**
 * Gets the start and end of day for Jerusalem, returned as UTC-equivalent dates
 * that can be used directly in Prisma queries.
 */
export function getJerusalemTodayRange() {
    const jNow = getJerusalemNow()
    const start = startOfDay(jNow)
    const end = endOfDay(jNow)

    // We need to convert these back to the absolute UTC time.
    // Since jNow was created from toLocaleString, its digits match Jerusalem.
    // To get the absolute UTC time, we need to know the offset.

    // A simpler way for Prisma is to just use the ISO digits if the DB stores local time,
    // but Prisma usually stores UTC.

    // Let's use a more robust calculation for the offset
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jerusalem',
        timeZoneName: 'longOffset'
    })
    const parts = formatter.formatToParts(now())
    const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || "GMT+2"
    const offsetNumber = parseInt(offsetStr.replace("GMT", "").replace("+", "")) || 2

    // Correct approach:
    // Jerusalem "2026-02-19T00:00:00" is UTC "2026-02-18T(24-offset):00:00"

    const getUTCForJerusalemISO = (iso: string) => {
        // raw ISO like 2026-02-19T00:00:00.000
        // We append the standard offset string
        const sign = offsetNumber >= 0 ? "+" : "-"
        const absOffset = Math.abs(offsetNumber)
        const offsetISO = `${sign}${String(absOffset).padStart(2, '0')}:00`
        return new Date(`${iso}${offsetISO}`) // This will be the incorrect way to use the offset in the string.
        // Correct way: "2026-02-19T00:00:00+02:00"
    }

    const offsetISO = offsetNumber >= 0
        ? `+${String(offsetNumber).padStart(2, '0')}:00`
        : `-${String(Math.abs(offsetNumber)).padStart(2, '0')}:00`

    const dateToISO = (d: Date) => {
        const Y = d.getFullYear()
        const M = String(d.getMonth() + 1).padStart(2, '0')
        const D = String(d.getDate()).padStart(2, '0')
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        const s = String(d.getSeconds()).padStart(2, '0')
        return `${Y}-${M}-${D}T${h}:${m}:${s}${offsetISO}`
    }

    return {
        start: new Date(dateToISO(start)),
        end: new Date(dateToISO(end)),
        yesterdayStart: new Date(dateToISO(startOfDay(subDays(jNow, 1)))),
        yesterdayEnd: new Date(dateToISO(endOfDay(subDays(jNow, 1)))),
        jNow
    }
}

function now() { return new Date() }
