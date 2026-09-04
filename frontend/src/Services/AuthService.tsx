import axiosInstance from "../Helpers/AxiosInstance"
import { handleError } from "../Helpers/ErrorHandler"
import type { UserProfile } from "../Models/User"

export const loginAPI = async (username: string, password: string) => {
  try {
    const data = await axiosInstance.post<UserProfile>("account/login", {
      username: username,
      password: password,
    })
    return data
  } catch (error) {
    handleError(error)
  }
}

export const registerAPI = async (
  email: string,
  username: string,
  password: string,
) => {
  try {
    const data = await axiosInstance.post<UserProfile>("account/register", {
      username: username,
      password: password,
      email: email,
    })
    return data
  } catch (error) {
    handleError(error)
  }
}

export const logoutAPI = async () => {
  try {
    await axiosInstance.post("account/logout")
  } catch (error) {
    console.error(error)
  }
}

// The session probe every visitor triggers on load. Guest browsing is
// supported, so "not signed in" comes back as 204 rather than the 401 that
// "account/profile" raises -- a failed request there would surface in the
// console and in error tracking on every anonymous page load.
export const getSessionAPI = async (): Promise<UserProfile | null> => {
  try {
    const res = await axiosInstance.get<UserProfile | "">("account/session")
    return res.status === 200 && res.data ? res.data : null
  } catch {
    return null
  }
}

export const getProfileAPI = async () => {
  try {
    const data = await axiosInstance.get<UserProfile>("account/profile")
    return data
  } catch {
    return undefined
  }
}