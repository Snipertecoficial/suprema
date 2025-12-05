import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            appointmentId,
            professionalId,
            unitId,
            conversationId,
            items, // [{ type: 'service', name: 'Corte', price: 120 }, ...]
            paymentMethod,
            discountAmount = 0
        } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Itens obrigatórios' }, { status: 400 })
        }

        // 1. Calcular valores
        const grossAmount = items.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0)

        // Calcular taxa de pagamento (exemplo: 2% para cartão de crédito)
        let paymentFee = 0
        if (paymentMethod === 'credito') paymentFee = grossAmount * 0.02
        else if (paymentMethod === 'debito') paymentFee = grossAmount * 0.01

        const netAmount = grossAmount - discountAmount - paymentFee

        // 2. Buscar regras de comissão do profissional
        const { data: rules } = await supabaseAdmin
            .from('commission_rules')
            .select('*')
            .eq('professional_id', professionalId)

        const serviceRules = rules?.filter(r => r.rule_type === 'service') || []
        const productRules = rules?.filter(r => r.rule_type === 'product') || []

        // 3. Calcular comissão
        let totalCommission = 0
        items.forEach((item: any) => {
            const itemTotal = item.price * (item.quantity || 1)
            let commissionPercentage = 0

            if (item.type === 'service') {
                const rule = serviceRules.find(r => r.applies_to === item.name || r.applies_to === 'all')
                commissionPercentage = rule?.percentage || 50 // Padrão 50%
            } else if (item.type === 'product') {
                const rule = productRules.find(r => r.applies_to === item.name || r.applies_to === 'all')
                commissionPercentage = rule?.percentage || 30 // Padrão 30%
            }

            totalCommission += (itemTotal * commissionPercentage) / 100
        })

        // Descontar taxas proporcionalmente da comissão
        const professionalAmount = totalCommission - (paymentFee * (totalCommission / grossAmount))
        const salonAmount = netAmount - professionalAmount

        // 4. Criar transação
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                unit_id: unitId,
                appointment_id: appointmentId,
                professional_id: professionalId,
                conversation_id: conversationId,
                gross_amount: grossAmount,
                discount: discountAmount,
                payment_fee: paymentFee,
                net_amount: netAmount,
                salon_amount: salonAmount,
                professional_amount: professionalAmount,
                payment_method: paymentMethod,
                payment_status: 'confirmed',
                paid_at: new Date().toISOString()
            })
            .select()
            .single()

        if (txError) throw txError

        // 5. Criar itens da transação
        const transactionItems = items.map((item: any) => ({
            transaction_id: transaction.id,
            item_type: item.type,
            item_reference: item.name,
            quantity: item.quantity || 1,
            unit_price: item.price,
            total_price: item.price * (item.quantity || 1)
        }))

        const { error: itemsError } = await supabaseAdmin
            .from('transaction_items')
            .insert(transactionItems)

        if (itemsError) throw itemsError

        // 6. Atualizar status do agendamento para 'completed' se fornecido
        if (appointmentId) {
            await supabaseAdmin
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appointmentId)
        }

        return NextResponse.json({
            success: true,
            transaction: {
                id: transaction.id,
                grossAmount,
                netAmount,
                professionalAmount,
                salonAmount,
                paymentFee
            }
        })

    } catch (error: any) {
        console.error('Erro ao processar venda:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Buscar transações
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const unitId = searchParams.get('unitId')
        const professionalId = searchParams.get('professionalId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        let query = supabaseAdmin
            .from('transactions')
            .select('*, transaction_items(*), appointments(service_name), conversations(contact_name)')
            .order('created_at', { ascending: false })

        if (unitId) query = query.eq('unit_id', unitId)
        if (professionalId) query = query.eq('professional_id', professionalId)
        if (startDate) query = query.gte('created_at', startDate)
        if (endDate) query = query.lte('created_at', endDate)

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ transactions: data })

    } catch (error: any) {
        console.error('Erro ao buscar transações:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
