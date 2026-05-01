import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import SplashScreen from './components/SplashScreen'

import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import ClientDetailPage from './pages/clients/ClientDetailPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ProjectCalendarPage from './pages/projects/ProjectCalendarPage'
import QuotesPage from './pages/quotes/QuotesPage'
import InvoicesPage from './pages/invoices/InvoicesPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import MembersPage from './pages/members/MembersPage'
import AcceptInvitePage from './pages/auth/AcceptInvitePage'
import ProfilePage from './pages/profile/ProfilePage'
import QuoteDetailPage from './pages/quotes/QuoteDetailPage'
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/" replace /> : children
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <ThemeProvider>
    <QueryClientProvider client={qc}>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
            </Route>

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/calendar" element={<ProjectCalendarPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/quotes" element={<QuotesPage />} />
              <Route path="/quotes/:id" element={<QuoteDetailPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  )
}
