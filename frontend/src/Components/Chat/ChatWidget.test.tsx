import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ChatWidget from "./ChatWidget"
import { LanguageProvider } from "../../i18n/LanguageProvider"
import { askDolfin } from "../../Services/ChatService"

vi.mock("../../Services/ChatService", () => ({
  askDolfin: vi.fn(),
}))

const ask = vi.mocked(askDolfin)

const renderWidget = () =>
  render(
    <LanguageProvider>
      <ChatWidget />
    </LanguageProvider>,
  )

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it("opens a labelled assistant dialog from the floating trigger", async () => {
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))

    expect(screen.getByRole("dialog", { name: /dol-fin asistanı/i })).toBeInTheDocument()
    expect(screen.getByText(/siteyi birlikte keşfedelim/i)).toBeInTheDocument()
  })

  it("sends a question and renders the grounded answer with its source", async () => {
    ask.mockResolvedValue({
      answer: "Cüzdan sayfasından yeni bir fiyat alarmı kurabilirsiniz.",
      sources: [{ title: "Fiyat alarmları", path: "/wallet" }],
      usedAi: false,
    })
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.type(screen.getByRole("textbox", { name: /sorunuzu yazın/i }), "Alarm nasıl kurulur?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))

    expect(await screen.findByText(/cüzdan sayfasından/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /fiyat alarmları/i })).toHaveAttribute("href", "/wallet")
    expect(ask).toHaveBeenCalledWith("Alarm nasıl kurulur?", "tr", [])
  })

  it("includes the recent conversation when asking a follow-up", async () => {
    ask
      .mockResolvedValueOnce({
        answer: "Cüzdan sayfasından alarm kurabilirsiniz.",
        sources: [],
        usedAi: false,
      })
      .mockResolvedValueOnce({
        answer: "Hedef fiyat alanı alarm kartındadır.",
        sources: [],
        usedAi: true,
      })
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    const input = screen.getByRole("textbox", { name: /sorunuzu yazın/i })
    await user.type(input, "Alarm nasıl kurulur?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))
    await screen.findByText(/cüzdan sayfasından alarm/i)

    await user.type(input, "Peki hedef fiyat nerede?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))

    expect(ask).toHaveBeenLastCalledWith("Peki hedef fiyat nerede?", "tr", [
      { role: "user", content: "Alarm nasıl kurulur?" },
      { role: "assistant", content: "Cüzdan sayfasından alarm kurabilirsiniz." },
    ])
  })

  it("closes the dialog on Escape and returns focus to the trigger", async () => {
    renderWidget()
    const user = userEvent.setup()
    const trigger = screen.getByRole("button", { name: /dol-fin asistanını aç/i })

    await user.click(trigger)
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("starts a new conversation and keeps it empty after remounting", async () => {
    ask.mockResolvedValue({
      answer: "Cüzdan sayfasından alarm kurabilirsiniz.",
      sources: [],
      usedAi: false,
    })
    const firstRender = renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.type(screen.getByRole("textbox", { name: /sorunuzu yazın/i }), "Alarm nasıl kurulur?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))
    expect(await screen.findByText("Cüzdan sayfasından alarm kurabilirsiniz.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /yeni sohbet/i }))

    expect(screen.queryByText("Alarm nasıl kurulur?")).not.toBeInTheDocument()
    expect(screen.queryByText("Cüzdan sayfasından alarm kurabilirsiniz.")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /nasıl portföy oluştururum/i })).toBeInTheDocument()

    firstRender.unmount()
    renderWidget()
    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))

    expect(screen.queryByText("Alarm nasıl kurulur?")).not.toBeInTheDocument()
  })

  it("restores the conversation after remounting", async () => {
    ask.mockResolvedValue({
      answer: "Alarm kartını Cüzdan sayfasında bulabilirsiniz.",
      sources: [{ title: "Fiyat alarmları", path: "/wallet" }],
      usedAi: false,
    })
    const firstRender = renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.type(screen.getByRole("textbox", { name: /sorunuzu yazın/i }), "Alarm kartı nerede?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))
    expect(await screen.findByText("Alarm kartını Cüzdan sayfasında bulabilirsiniz.")).toBeInTheDocument()

    firstRender.unmount()
    renderWidget()
    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))

    expect(screen.getByText("Alarm kartı nerede?")).toBeInTheDocument()
    expect(screen.getByText("Alarm kartını Cüzdan sayfasında bulabilirsiniz.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /fiyat alarmları/i })).toHaveAttribute("href", "/wallet")
  })

  it("ignores invalid saved conversation data", async () => {
    window.localStorage.setItem("dolfin.chat.messages", "not-json")

    renderWidget()
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))

    expect(screen.getByRole("button", { name: /nasıl portföy oluştururum/i })).toBeInTheDocument()
  })
})
