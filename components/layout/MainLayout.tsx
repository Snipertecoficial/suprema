'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/login'
    const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/super-admin')

    if (isLoginPage || isAdminPage) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto md:ml-64">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
