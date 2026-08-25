/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react"
import type { ReactNode } from "react"
import { createBrowserRouter } from "react-router-dom"
import App from "../App"
import ProtectedRoute from "./ProtectedRoute"
import Spinners from "../Components/Spinners/Spinners"

const HomePage = lazy(() => import("../Pages/HomePage/HomePage"))
const SearchPage = lazy(() => import("../Pages/SearchPage/SearchPage"))
const CompanyPage = lazy(() => import("../Pages/CompanyPage/CompanyPage"))
const CompanyProfile = lazy(() => import("../Pages/CompanyProfile/CompanyProfile"))
const IncomeStatement = lazy(() => import("../Components/IncomeStatement/IncomeStatement"))
const BalanceSheet = lazy(() => import("../Components/BalanceSheet/BalanceSheet"))
const CashFlowStatement = lazy(() => import("../Components/CashFlowStatement/CashFlowStatement"))
const LoginPage = lazy(() => import("../Pages/LoginPage/LoginPage"))
const RegisterPage = lazy(() => import("../Pages/RegisterPage/RegisterPage"))
const WalletPage = lazy(() => import("../Pages/WalletPage/WalletPage"))

const PageFallback = () => (
    <div className="w-full min-h-screen bg-onyx-canvas flex items-center justify-center">
        <Spinners />
    </div>
)

const withSuspense = (element: ReactNode) => (
    <Suspense fallback={<PageFallback />}>{element}</Suspense>
)

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "", element: withSuspense(<HomePage />) },
            { path: "login", element: withSuspense(<LoginPage />) },
            { path: "register", element: withSuspense(<RegisterPage />) },
            // Search and the company pages are deliberately open: a visitor
            // can read the catalog and the discussion before deciding to sign
            // up. Everything that touches a wallet stays protected.
            { path: "search", element: withSuspense(<SearchPage />) },
            {
                path: "wallet",
                element: (
                    <ProtectedRoute>
                        {withSuspense(<WalletPage />)}
                    </ProtectedRoute>
                ),
            },
            {
                path: "company/:ticker",
                element: withSuspense(<CompanyPage />),
                children: [
                    { path: "company-profile", element: withSuspense(<CompanyProfile />) },
                    { path: "income-statement", element: withSuspense(<IncomeStatement />) },
                    { path: "balance-sheet", element: withSuspense(<BalanceSheet />) },
                    { path: "cashflow-statement", element: withSuspense(<CashFlowStatement />) },
                ],
            },
        ],
    },
])
