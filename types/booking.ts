export type ExpertiseLevel = 'junior' | 'intermediate' | 'senior' | 'master'

export interface OnlineBookingSettings {
    id?: string
    unit_id: string
    is_enabled?: boolean
    logo_url?: string | null
    banner_url?: string | null
    page_title?: string | null
    page_description?: string | null
    welcome_message?: string | null
    confirmation_message?: string | null
    primary_color: string
    secondary_color: string
    accent_color: string
    background_color: string
    text_color: string
    slot_interval_minutes: number
    max_advance_days: number
    auto_confirm: boolean
    show_professional_photos?: boolean
    show_professional_expertise?: boolean
    allow_online_payment?: boolean
    timezone?: string | null
    created_at?: string
    updated_at?: string
}

export interface Service {
    id: string
    unit_id: string
    name: string
    price: number
    duration: number
    description?: string | null
    photo_url?: string | null
    available_online?: boolean
}

export interface Professional {
    id: string
    full_name: string
    photo_url?: string | null
}

export interface ProfessionalWithService extends Professional {
    rating?: number
    total_reviews?: number
    total_appointments_completed?: number
    is_featured?: boolean
    display_order?: number
    expertise_level: ExpertiseLevel
    custom_price?: number | null
    custom_duration?: number | null
}

export interface TimeSlot {
    time: string
    available: boolean
}

export const EXPERTISE_BADGES: Record<ExpertiseLevel, { label: string; color: string }> = {
    junior: {
        label: 'Júnior',
        color: 'bg-emerald-100 text-emerald-800'
    },
    intermediate: {
        label: 'Pleno',
        color: 'bg-blue-100 text-blue-800'
    },
    senior: {
        label: 'Sênior',
        color: 'bg-purple-100 text-purple-800'
    },
    master: {
        label: 'Master',
        color: 'bg-amber-100 text-amber-800'
    }
}
