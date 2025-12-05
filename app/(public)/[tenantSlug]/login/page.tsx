import { notFound } from 'next/navigation'
import { getUnitBySlug } from '@/lib/units'
import { TenantLoginForm } from '@/components/auth/TenantLoginForm'

interface PageProps {
    params: Promise<{
        tenantSlug: string
    }>
}

export default async function TenantLoginPage({ params }: PageProps) {
    const { tenantSlug } = await params
    const unit = await getUnitBySlug(tenantSlug)

    if (!unit) {
        notFound()
    }

    return <TenantLoginForm unit={unit} />
}

export async function generateMetadata({ params }: PageProps) {
    const { tenantSlug } = await params
    const unit = await getUnitBySlug(tenantSlug)

    if (!unit) {
        return {
            title: 'Tenant Not Found',
        }
    }

    return {
        title: `Login - ${unit.brand_name || unit.name}`,
        description: `Acesse o painel de ${unit.brand_name || unit.name}`,
    }
}
