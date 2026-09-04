import { useEffect, useState } from "react"
import type { UserProfile } from "../Models/User"
import { useNavigate } from "react-router"
import {
    getProfileAPI,
    getSessionAPI,
    loginAPI,
    logoutAPI,
    registerAPI,
} from "../Services/AuthService"
import { toast } from "react-toastify"
import React from "react"
import { UserContext } from "./UserContext"

type Props = { children: React.ReactNode }

export const UserProvider = ({ children }: Props) => {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const restoreSession = async () => {
            const profile = await getSessionAPI()
            if (profile) {
                setUser(profile)
            }
            setIsReady(true)
        }
        restoreSession()
    }, [])

    const updateWalletBalance = (newBalance: number) => {
        setUser((prev) => {
            if (!prev || prev.walletBalance === newBalance) return prev
            return { ...prev, walletBalance: newBalance }
        })
    }

    const primeCsrfCookie = async () => {
        await getProfileAPI()
    }

    const registerUser = async (email: string, username: string, password: string) => {
        await registerAPI(email, username, password)
            .then(async (res) => {
                if (res && res.data) {
                    setUser(res.data)
                    toast.success("Registration Success!")
                    await primeCsrfCookie()

                    setTimeout(() => {
                        navigate("/search")
                    }, 50)
                }
            })
            .catch((e) => {
                console.error(e)
                toast.warning("Server error occurred")
            })
    }

    const loginUser = async (username: string, password: string) => {
        await loginAPI(username, password)
            .then(async (res) => {
                if (res && res.data) {
                    setUser(res.data)
                    toast.success("Login Success!")
                    await primeCsrfCookie()

                    setTimeout(() => {
                        navigate("/search")
                    }, 50)
                }
            })
            .catch((e) => {
                console.error(e)
                toast.warning("Server error occurred")
            })
    }

    const isLoggedIn = () => {
        return !!user
    }

    const logout = () => {
        logoutAPI().finally(() => {
            setUser(null)
            navigate("/")
        })
    }

    return (
        <UserContext.Provider
            value={{ loginUser, user, logout, isLoggedIn, registerUser, updateWalletBalance }}
        >
            {isReady ? children : null}
        </UserContext.Provider>
    )
}
