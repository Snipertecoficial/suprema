import { redirect } from 'next/navigation'

export default function DefaultLoginPage() {
    // Redirect to AION3 platform login
    redirect('/aion3/login')
}
