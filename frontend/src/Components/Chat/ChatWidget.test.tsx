import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ChatWidget from "./ChatWidget"
import { LanguageProvider } from "../../i18n/LanguageProvider"
import { askDolfin } from "../../Services/ChatService"
import { portfolioAddAPI, portfolioGetAPI, portfolioSellAPI } from "../../Services/PortfolioService"
import { searchStocksBySymbolAPI } from "../../Services/StockService"
import { useAuth } from "../../Context/useAuth"

vi.mock("../../Services/ChatService", () => ({
  askDolfin: vi.fn(),
}))
vi.mock("../../Services/PortfolioService", () => ({
  portfolioAddAPI: vi.fn(),
  portfolioGetAPI: vi.fn(),
  portfolioSellAPI: vi.fn(),
}))
vi.mock("../../Services/StockService", () => ({ searchStocksBySymbolAPI: vi.fn() }))
vi.mock("../../Context/useAuth", () => ({ useAuth: vi.fn() }))

const ask = vi.mocked(askDolfin)
const getPortfolio = vi.mocked(portfolioGetAPI)
const buyStock = vi.mocked(portfolioAddAPI)
const sellStock = vi.mocked(portfolioSellAPI)
const searchStock = vi.mocked(searchStocksBySymbolAPI)
const auth = vi.mocked(useAuth)

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
    auth.mockReturnValue({
      user: null,
      updateWalletBalance: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
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

  it("offers grounded follow-up suggestions and places one in the composer", async () => {
    ask.mockResolvedValue({
      answer: "Fiyat alarmını Cüzdan sayfasından kurabilirsiniz.",
      sources: [],
      usedAi: false,
      suggestions: ["Tetiklenen alarmları nerede görürüm?"],
    })
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.type(screen.getByRole("textbox", { name: /sorunuzu yazın/i }), "Alarm nasıl kurulur?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))

    const followUp = await screen.findByRole("button", {
      name: "Tetiklenen alarmları nerede görürüm?",
    })
    await user.click(followUp)

    expect(screen.getByRole("textbox", { name: /sorunuzu yazın/i })).toHaveValue(
      "Tetiklenen alarmları nerede görürüm?",
    )
  })

  it("keeps multiple conversations and switches between them from history", async () => {
    ask
      .mockResolvedValueOnce({ answer: "İlk cevap", sources: [], usedAi: false })
      .mockResolvedValueOnce({ answer: "İkinci cevap", sources: [], usedAi: false })
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    const input = screen.getByRole("textbox", { name: /sorunuzu yazın/i })
    await user.type(input, "Alarm nasıl kurulur?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))
    await screen.findByText("İlk cevap")

    await user.click(screen.getByRole("button", { name: /yeni sohbet/i }))
    await user.type(input, "Portföyümü nasıl görürüm?")
    await user.click(screen.getByRole("button", { name: /gönder/i }))
    await screen.findByText("İkinci cevap")

    await user.click(screen.getByRole("button", { name: /sohbet geçmişi/i }))
    await user.click(screen.getByRole("button", { name: "Alarm nasıl kurulur?" }))

    expect(screen.getByText("İlk cevap")).toBeInTheDocument()
    expect(screen.queryByText("İkinci cevap")).not.toBeInTheDocument()
  })

  it("clears every saved conversation after explicit confirmation", async () => {
    ask.mockResolvedValue({ answer: "Saklanan cevap", sources: [], usedAi: false })
    const firstRender = renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.type(screen.getByRole("textbox", { name: /sorunuzu yazın/i }), "Saklanan soru")
    await user.click(screen.getByRole("button", { name: /gönder/i }))
    await screen.findByText("Saklanan cevap")
    await user.click(screen.getByRole("button", { name: /sohbet geçmişi/i }))
    await user.click(screen.getByRole("button", { name: /tüm konuşmaları temizle/i }))
    await user.click(screen.getByRole("button", { name: /evet, temizle/i }))

    firstRender.unmount()
    renderWidget()
    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))

    expect(screen.queryByText("Saklanan soru")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /nasıl portföy oluştururum/i })).toBeInTheDocument()
  })

  it("shows the signed-in user's current simulated portfolio", async () => {
    auth.mockReturnValue({
      user: { userName: "ada", email: "ada@example.com", walletBalance: 700 },
      updateWalletBalance: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
    getPortfolio.mockResolvedValue({
      data: [
        {
          id: 1,
          symbol: "AAPL",
          companyName: "Apple",
          purchase: 150,
          lastDiv: 0,
          industry: "Technology",
          marketCap: 1,
          quantity: 2,
          averagePrice: 120,
        },
      ],
    } as Awaited<ReturnType<typeof portfolioGetAPI>>)
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.click(screen.getByRole("button", { name: /portföyümü göster/i }))

    expect(await screen.findByText(/AAPL: 2 adet/i)).toBeInTheDocument()
    expect(screen.getByText(/güncel değer: \$300\.00/i)).toBeInTheDocument()
    expect(screen.getByText(/sanal bakiye: \$700\.00/i)).toBeInTheDocument()
  })

  it("requires sign-in before accessing private portfolio actions", async () => {
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.click(screen.getByRole("button", { name: /portföyümü göster/i }))

    expect(await screen.findByText(/portföyünüzü görmek.*giriş yapın/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /sanal portföyüm/i })).toHaveAttribute("href", "/login")
    expect(getPortfolio).not.toHaveBeenCalled()
  })

  it("previews a simulated buy and only submits it after confirmation", async () => {
    const updateWalletBalance = vi.fn()
    auth.mockReturnValue({
      user: { userName: "ada", email: "ada@example.com", walletBalance: 1000 },
      updateWalletBalance,
    } as unknown as ReturnType<typeof useAuth>)
    searchStock.mockResolvedValue({
      data: [{ id: 1, symbol: "AAPL", companyName: "Apple", purchase: 150 }],
    } as Awaited<ReturnType<typeof searchStocksBySymbolAPI>>)
    buyStock.mockResolvedValue({ data: { message: "ok", newBalance: 700 } } as Awaited<
      ReturnType<typeof portfolioAddAPI>
    >)
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.click(screen.getByRole("button", { name: /simülasyon işlemi/i }))
    await user.selectOptions(screen.getByRole("combobox", { name: "İşlem türü" }), "BUY")
    await user.type(screen.getByRole("textbox", { name: /hisse kodu/i }), "AAPL")
    await user.clear(screen.getByRole("spinbutton", { name: /adet/i }))
    await user.type(screen.getByRole("spinbutton", { name: /adet/i }), "2")
    await user.click(screen.getByRole("button", { name: "İşlemi önizle" }))

    expect(await screen.findByText(/tahmini toplam: \$300\.00/i)).toBeInTheDocument()
    expect(buyStock).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /2 adet AAPL alımını onayla/i }))

    expect(buyStock).toHaveBeenCalledWith("AAPL", 2)
    expect(updateWalletBalance).toHaveBeenCalledWith(700)
    expect(await screen.findByText(/2 adet AAPL alındı/i)).toBeInTheDocument()
    expect(sellStock).not.toHaveBeenCalled()
  })

  it("checks holdings before confirming a simulated sale", async () => {
    const updateWalletBalance = vi.fn()
    auth.mockReturnValue({
      user: { userName: "ada", email: "ada@example.com", walletBalance: 700 },
      updateWalletBalance,
    } as unknown as ReturnType<typeof useAuth>)
    searchStock.mockResolvedValue({
      data: [{ id: 1, symbol: "AAPL", companyName: "Apple", purchase: 150 }],
    } as Awaited<ReturnType<typeof searchStocksBySymbolAPI>>)
    getPortfolio.mockResolvedValue({
      data: [
        {
          id: 1,
          symbol: "AAPL",
          companyName: "Apple",
          purchase: 150,
          lastDiv: 0,
          industry: "Technology",
          marketCap: 1,
          quantity: 3,
          averagePrice: 120,
        },
      ],
    } as Awaited<ReturnType<typeof portfolioGetAPI>>)
    sellStock.mockResolvedValue({ data: { message: "ok", newBalance: 850 } } as Awaited<
      ReturnType<typeof portfolioSellAPI>
    >)
    renderWidget()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /dol-fin asistanını aç/i }))
    await user.click(screen.getByRole("button", { name: /simülasyon işlemi/i }))
    await user.selectOptions(screen.getByRole("combobox", { name: "İşlem türü" }), "SELL")
    await user.type(screen.getByRole("textbox", { name: /hisse kodu/i }), "AAPL")
    await user.clear(screen.getByRole("spinbutton", { name: /adet/i }))
    await user.type(screen.getByRole("spinbutton", { name: /adet/i }), "1")
    await user.click(screen.getByRole("button", { name: "İşlemi önizle" }))
    await user.click(await screen.findByRole("button", { name: /1 adet AAPL satışını onayla/i }))

    expect(getPortfolio).toHaveBeenCalledOnce()
    expect(sellStock).toHaveBeenCalledWith("AAPL", 1)
    expect(updateWalletBalance).toHaveBeenCalledWith(850)
    expect(await screen.findByText(/1 adet AAPL satıldı/i)).toBeInTheDocument()
    expect(buyStock).not.toHaveBeenCalled()
  })
})
