import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">CRM</h1>
        <Outlet />
      </div>
    </div>
  )
}
