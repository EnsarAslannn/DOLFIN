import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import NotificationBell from "./NotificationBell"
import {
    alertNotificationReadAPI,
    alertNotificationsGetAPI,
} from "../../../Services/AlertService"
import { notifyAlertsChanged } from "../../../Helpers/alertEvents"
import type { AlertNotification } from "../../../Models/Alert"

vi.mock("../../../Services/AlertService", () => ({
    alertNotificationsGetAPI: vi.fn(),
    alertNotificationReadAPI: vi.fn(),
}))

const listNotifications = vi.mocked(alertNotificationsGetAPI)
const markRead = vi.mocked(alertNotificationReadAPI)

const makeNotification = (
    overrides: Partial<AlertNotification> = {},
): AlertNotification => ({
    id: 1,
    priceAlertId: 1,
    message: "TSLA reached 260.00 (target 250.00).",
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
})

const respondWith = (notifications: AlertNotification[]) => {
    listNotifications.mockResolvedValue({
        data: notifications,
    } as Awaited<ReturnType<typeof alertNotificationsGetAPI>>)
}

const renderBell = () =>
    render(
        <MemoryRouter>
            <NotificationBell isLight={false} />
        </MemoryRouter>,
    )

const openPanel = async () => {
    const user = userEvent.setup()
    await user.click(await screen.findByRole("button", { name: /bildirimler/i }))
    return user
}

describe("NotificationBell", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        respondWith([])
        markRead.mockResolvedValue(undefined)
    })

    it("counts only the unread notifications on the bell", async () => {
        respondWith([
            makeNotification({ id: 1, isRead: false }),
            makeNotification({ id: 2, isRead: false }),
            makeNotification({ id: 3, isRead: true }),
        ])

        renderBell()

        expect(
            await screen.findByRole("button", { name: /2 okunmamış/i }),
        ).toBeInTheDocument()
    })

    it("labels the bell without a count when everything is read", async () => {
        respondWith([makeNotification({ isRead: true })])

        renderBell()

        await waitFor(() => expect(listNotifications).toHaveBeenCalled())
        expect(
            screen.getByRole("button", { name: /^bildirimler$/i }),
        ).toBeInTheDocument()
    })

    it("keeps the panel closed until the bell is clicked", async () => {
        respondWith([makeNotification()])

        renderBell()

        await waitFor(() => expect(listNotifications).toHaveBeenCalled())
        expect(screen.queryByText(/TSLA reached/)).not.toBeInTheDocument()

        await openPanel()

        expect(screen.getByText(/TSLA reached/)).toBeInTheDocument()
    })

    it("points a user with no alerts at the wallet", async () => {
        renderBell()

        await openPanel()

        expect(screen.getByText(/henüz tetiklenen bir alarm yok/i)).toBeInTheDocument()
        expect(
            screen.getByRole("link", { name: /fiyat alarmı kur/i }),
        ).toHaveAttribute("href", "/wallet")
    })

    it("marks a notification read when it is clicked", async () => {
        respondWith([makeNotification({ id: 9 })])

        renderBell()
        const user = await openPanel()

        const panel = screen.getByRole("region", { name: /fiyat alarmı bildirimleri/i })
        await user.click(within(panel).getByText(/TSLA reached/))

        expect(markRead).toHaveBeenCalledWith(9)
    })

    // The badge has to answer the click before the round trip finishes,
    // otherwise the count looks stuck while the request is in flight.
    it("drops the unread count before the server answers", async () => {
        respondWith([makeNotification({ id: 9 })])
        markRead.mockReturnValue(new Promise(() => {}))

        renderBell()
        const user = await openPanel()

        await user.click(screen.getByText(/TSLA reached/))

        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: /^bildirimler$/i }),
            ).toBeInTheDocument(),
        )
    })

    it("marks every unread notification read in one go", async () => {
        respondWith([
            makeNotification({ id: 1 }),
            makeNotification({ id: 2 }),
            makeNotification({ id: 3, isRead: true }),
        ])

        renderBell()
        const user = await openPanel()

        await user.click(screen.getByRole("button", { name: /tümünü okundu işaretle/i }))

        expect(markRead).toHaveBeenCalledWith(1)
        expect(markRead).toHaveBeenCalledWith(2)
        expect(markRead).not.toHaveBeenCalledWith(3)
    })

    it("closes the panel on Escape", async () => {
        respondWith([makeNotification()])

        renderBell()
        const user = await openPanel()

        await user.keyboard("{Escape}")

        expect(screen.queryByText(/TSLA reached/)).not.toBeInTheDocument()
    })

    // The wallet page can add or remove an alert, and neither component can
    // see the other's state.
    it("re-reads notifications when an alert changes elsewhere", async () => {
        renderBell()
        await waitFor(() => expect(listNotifications).toHaveBeenCalledTimes(1))

        notifyAlertsChanged()

        await waitFor(() => expect(listNotifications).toHaveBeenCalledTimes(2))
    })
})
