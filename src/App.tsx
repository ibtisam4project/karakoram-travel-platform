import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import { AppRoutes } from "@/routes"
import { Toaster } from "@/components/ui/sonner"

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="caravan-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
