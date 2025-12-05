import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const appointmentId = formData.get('appointmentId') as string
        const photoType = formData.get('photoType') as 'before' | 'after'

        if (!file || !appointmentId || !photoType) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de arquivo inválido' }, { status: 400 })
        }

        // Criar nome único para o arquivo
        const fileExt = file.name.split('.').pop()
        const fileName = `${appointmentId}_${photoType}_${Date.now()}.${fileExt}`
        const filePath = `appointments/${fileName}`

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('appointment-photos')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) throw uploadError

        // Obter URL pública
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('appointment-photos')
            .getPublicUrl(filePath)

        // Salvar registro no banco
        const { data: photoData, error: dbError } = await supabaseAdmin
            .from('appointment_photos')
            .insert({
                appointment_id: appointmentId,
                photo_type: photoType,
                photo_url: publicUrl
            })
            .select()
            .single()

        if (dbError) throw dbError

        return NextResponse.json({ success: true, photo: photoData })

    } catch (error: any) {
        console.error('Erro ao fazer upload:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Listar fotos de um agendamento
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const appointmentId = searchParams.get('appointmentId')

        if (!appointmentId) {
            return NextResponse.json({ error: 'ID do agendamento é obrigatório' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('appointment_photos')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('uploaded_at', { ascending: true })

        if (error) throw error

        return NextResponse.json({ photos: data })

    } catch (error: any) {
        console.error('Erro ao buscar fotos:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
