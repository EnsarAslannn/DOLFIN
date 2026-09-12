import { Outlet } from "react-router"
import "./App.css"
import Navbar from "./Components/Navbar/Navbar"
import "react-toastify/dist/ReactToastify.css"
import { ToastContainer } from "react-toastify"
import { UserProvider } from "./Context/AuthContext"
import { useHashScroll } from "./Helpers/useHashScroll"
import SessionExpired from "./Components/SessionExpired/SessionExpired"

function App() {
  useHashScroll()

  return (
    <>
      <UserProvider>
        <Navbar />
        <Outlet />
        {/* Inside the provider: it needs the auth context to know whether
            there was a session to lose, and to clear it. */}
        <SessionExpired />
        <ToastContainer theme="dark" position="bottom-right" />
      </UserProvider>
    </>
  )
}

export default App
