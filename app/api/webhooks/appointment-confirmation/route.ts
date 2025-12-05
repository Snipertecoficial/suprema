import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role (bypass RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { appointmentId, confirmed, token } = body

        // Validar parâmetros
        if (!appointmentId || confirmed === undefined) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            )
        }

        // Buscar agendamento
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .single()

        if (fetchError || !appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            )
        }

        // Validar token se fornecido
        if (token && appointment.confirmation_token !== token) {
            return NextResponse.json(
                { error: 'Invalid confirmation token' },
                { status: 403 }
            )
        }

        // Atualizar status do agendamento
        const newStatus = confirmed ? 'confirmed' : 'cancelled'

        const { error: updateError } = await supabase
            .from('appointments')
            .update({
                client_confirmed: confirmed,
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)

        if (updateError) {
            console.error('Error updating appointment:', updateError)
            return NextResponse.json(
                { error: 'Failed to update appointment' },
                { status: 500 }
            )
        }

        // Log da confirmação
        console.log(`Appointment ${appointmentId} ${confirmed ? 'confirmed' : 'cancelled'} by client`)

        return NextResponse.json({
            success: true,
            appointmentId,
            status: newStatus,
            message: confirmed
                ? 'Agendamento confirmado com sucesso!'
                : 'Agendamento cancelado com sucesso!'
        })

    } catch (error: any) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

// Endpoint GET para verificar status de um agendamento
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const appointmentId = searchParams.get('appointmentId')
        const token = searchParams.get('token')

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Missing appointmentId parameter' },
                { status: 400 }
            )
        }

        const { data: appointment, error } = await supabase
            .from('appointments')
            .select('id, status, client_confirmed, start_time, service_name, professional_name')
            .eq('id', appointmentId)
            .single()

        if (error || !appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            )
        }

        // Validar token se fornecido
        if (token) {
            const { data: fullAppointment } = await supabase
                .from('appointments')
                .select('confirmation_token')
                .eq('id', appointmentId)
                .single()

            if (fullAppointment?.confirmation_token !== token) {
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 403 }
                )
            }
        }

        return NextResponse.json({
            success: true,
            appointment: {
                id: appointment.id,
                status: appointment.status,
                confirmed: appointment.client_confirmed,
                startTime: appointment.start_time,
                service: appointment.service_name,
                professional: appointment.professional_name
            }
        })

    } catch (error: any) {
        console.error('GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
