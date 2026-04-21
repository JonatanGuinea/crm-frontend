import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-fg mb-8">CRM</h1>
        <Outlet />
      </div>
    </div>
  )
}
