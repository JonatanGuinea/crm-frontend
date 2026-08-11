import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmDialog'
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
import NotificationsPage from './pages/notifications/NotificationsPage'
import MembersPage from './pages/members/MembersPage'
import AcceptInvitePage from './pages/auth/AcceptInvitePage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ConfirmPasswordChangePage from './pages/auth/ConfirmPasswordChangePage'
import ProfilePage from './pages/profile/ProfilePage'
import OrgSettingsPage from './pages/org/OrgSettingsPage'
import QuoteDetailPage from './pages/quotes/QuoteDetailPage'
import ExpensesPage from './pages/expenses/ExpensesPage'
import FinancesDashboard from './pages/finances/FinancesDashboard'
import MovementsPage from './pages/finances/MovementsPage'
import AccountsPage from './pages/finances/AccountsPage'
import CategoriesPage from './pages/finances/CategoriesPage'
import TasksPage from './pages/tasks/TasksPage'
import QuotePublicPage from './pages/public/QuotePublicPage'
import StockDashboard from './pages/stock/StockDashboard'
import ReportsPage from './pages/reports/ReportsPage'
import ProductsPage from './pages/stock/ProductsPage'
import ProductDetailPage from './pages/stock/ProductDetailPage'
import ProvidersPage from './pages/stock/ProvidersPage'
import HelpPage from './pages/help/HelpPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

const storedToken = localStorage.getItem('token')
const initiallyAuthenticated = storedToken && isTokenValid(storedToken)

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/" replace /> : children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user?.role !== 'member' ? children : <Navigate to="/" replace />
}

function OwnerRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'owner' ? children : <Navigate to="/" replace />
}

export default function App() {
  const [splashDone, setSplashDone] = useState(!initiallyAuthenticated)

  return (
    <ThemeProvider>
    <QueryClientProvider client={qc}>
    <ToastProvider>
    <ConfirmProvider>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/confirm-password-change" element={<ConfirmPasswordChangePage />} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
            </Route>

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/calendar" element={<ProjectCalendarPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/quotes" element={<AdminRoute><QuotesPage /></AdminRoute>} />
              <Route path="/quotes/:id" element={<AdminRoute><QuoteDetailPage /></AdminRoute>} />
              <Route path="/expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
              <Route path="/finances" element={<AdminRoute><FinancesDashboard /></AdminRoute>} />
              <Route path="/finances/movements" element={<AdminRoute><MovementsPage /></AdminRoute>} />
              <Route path="/finances/accounts" element={<AdminRoute><AccountsPage /></AdminRoute>} />
              <Route path="/finances/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/stock" element={<StockDashboard />} />
              <Route path="/stock/products" element={<ProductsPage />} />
              <Route path="/stock/products/:id" element={<ProductDetailPage />} />
              <Route path="/stock/providers" element={<ProvidersPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/organization" element={<OwnerRoute><OrgSettingsPage /></OwnerRoute>} />
              <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
              <Route path="/help" element={<HelpPage />} />
            </Route>

            <Route path="/p/presupuesto/:id" element={<QuotePublicPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfirmProvider>
    </ToastProvider>
    </QueryClientProvider>
    </ThemeProvider>
  )
}
