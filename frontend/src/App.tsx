import { Outlet } from "react-router"
import "./App.css"
import Navbar from "./Components/Navbar/Navbar"
import "react-toastify/dist/ReactToastify.css"
import { ToastContainer } from "react-toastify"
import { UserProvider } from "./Context/AuthContext"
import { useHashScroll } from "./Helpers/useHashScroll"

function App() {
  useHashScroll()

  return (
    <>
      <UserProvider>
        <Navbar />
        <Outlet />
        <ToastContainer theme="dark" position="bottom-right" />
      </UserProvider>
    </>
  )
}

export default App
