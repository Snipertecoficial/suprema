'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Package, Plus, AlertCircle, TrendingDown, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Product = {
    id: string
    name: string
    category: string
    current_stock: number
    min_stock: number
    unit_measure: string
    cost_price: number
    sell_price: number
    photo_url: string | null
}

export default function EstoquePage() {
    const { profile } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isMovementOpen, setIsMovementOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Form states
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [minStock, setMinStock] = useState('0')
    const [unitMeasure, setUnitMeasure] = useState('unidade')
    const [costPrice, setCostPrice] = useState('')
    const [sellPrice, setSellPrice] = useState('')

    // Movement form
    const [movementType, setMovementType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada')
    const [quantity, setQuantity] = useState('')
    const [notes, setNotes] = useState('')
    const [photoUrl, setPhotoUrl] = useState('')
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (profile?.unit_id) {
            fetchProducts()
        }
    }, [profile?.unit_id])

    const fetchProducts = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('unit_id', profile?.unit_id)
            .order('name')

        if (data) setProducts(data)
        setLoading(false)
    }

    const handleImageUpload = async (file: File): Promise<string | null> => {
        if (!profile?.unit_id) return null

        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.unit_id}/${Date.now()}.${fileExt}`

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName)

            return publicUrl
        } catch (error: any) {
            toast.error('Erro ao fazer upload: ' + error.message)
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault()

        let finalPhotoUrl = photoUrl

        // Se houver arquivo de imagem, fazer upload
        if (photoFile) {
            const uploadedUrl = await handleImageUpload(photoFile)
            if (uploadedUrl) finalPhotoUrl = uploadedUrl
        }

        const { error } = await supabase.from('products').insert({
            unit_id: profile?.unit_id,
            name,
            category,
            current_stock: 0,
            min_stock: parseFloat(minStock),
            unit_measure: unitMeasure,
            cost_price: parseFloat(costPrice),
            sell_price: parseFloat(sellPrice),
            photo_url: finalPhotoUrl || null
        })

        if (error) {
            toast.error('Erro ao criar produto: ' + error.message)
            return
        }

        setIsCreateOpen(false)
        fetchProducts()
        // Limpar form
        setName('')
        setCategory('')
        setMinStock('0')
        setCostPrice('')
        setSellPrice('')
        setPhotoUrl('')
        setPhotoFile(null)
    }

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)

            if (error) throw error

            fetchProducts()
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message)
        }
    }

    const handleMovement = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct) return

        const { error } = await supabase.from('stock_movements').insert({
            product_id: selectedProduct.id,
            movement_type: movementType,
            quantity: parseFloat(quantity),
            reference_type: 'adjustment',
            notes
        })

        if (error) {
            toast.error('Erro ao registrar movimentação: ' + error.message)
            return
        }

        setIsMovementOpen(false)
        fetchProducts()
        setQuantity('')
        setNotes('')
    }

    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock)

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Controle de Estoque</h1>
                    <p className="text-gray-500">Gerencie produtos e movimentações</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-[#00a884] hover:bg-[#008f6f]">
                    <Plus className="mr-2 h-4 w-4" /> Novo Produto
                </Button>
            </div>

            {/* Alertas de Estoque Baixo */}
            {lowStockProducts.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <AlertCircle size={20} />
                            {lowStockProducts.length} produtos com estoque baixo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {lowStockProducts.map(p => (
                                <Badge key={p.id} variant="destructive">
                                    {p.name}: {p.current_stock} {p.unit_measure}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lista de Produtos */}
            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : products.length === 0 ? (
                <Card className="p-12 text-center">
                    <Package size={48} className="mx-auto opacity-50 text-gray-400" />
                    <p className="text-lg font-medium text-gray-500 mt-4">Nenhum produto cadastrado</p>
                    <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                        Cadastrar Primeiro Produto
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.map(product => (
                        <Card key={product.id} className={`hover:shadow-md transition-shadow ${product.current_stock <= product.min_stock ? 'border-red-300' : ''}`}>
                            <CardHeader>
                                {product.photo_url && (
                                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={product.photo_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>{product.name}</span>
                                    <Badge variant="outline">{product.category}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Estoque Atual</span>
                                    <span className={`font-bold text-lg ${product.current_stock <= product.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                                        {product.current_stock} {product.unit_measure}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Estoque Mínimo</span>
                                    <span>{product.min_stock} {product.unit_measure}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 border-t">
                                    <span className="text-gray-500">Custo</span>
                                    <span>R$ {product.cost_price?.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Venda</span>
                                    <span className="font-semibold text-green-700">R$ {product.sell_price?.toFixed(2)}</span>
                                </div>

                                <Button
                                    onClick={() => {
                                        setSelectedProduct(product)
                                        setIsMovementOpen(true)
                                    }}
                                    variant="outline"
                                    className="w-full mt-2"
                                    size="sm"
                                >
                                    <TrendingDown className="mr-2 h-4 w-4" />
                                    Movimentar Estoque
                                </Button>

                                <Button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    variant="destructive"
                                    className="w-full mt-2"
                                    size="sm"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Produto
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Criar Produto */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Produto</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProduct} className="space-y-4">
                        <div>
                            <Label>Nome do Produto</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div>
                            <Label>Categoria</Label>
                            <Select value={category} onValueChange={setCategory} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tinta">Tintas</SelectItem>
                                    <SelectItem value="shampoo">Shampoos</SelectItem>
                                    <SelectItem value="tratamento">Tratamentos</SelectItem>
                                    <SelectItem value="oxidante">Oxidantes</SelectItem>
                                    <SelectItem value="outros">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Estoque Mínimo</Label>
                                <Input type="number" step="0.01" value={minStock} onChange={e => setMinStock(e.target.value)} required />
                            </div>
                            <div>
                                <Label>Unidade</Label>
                                <Select value={unitMeasure} onValueChange={setUnitMeasure}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unidade">Unidade</SelectItem>
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="g">g</SelectItem>
                                        <SelectItem value="L">Litro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Preço de Custo</Label>
                                <Input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} required />
                            </div>
                            <div>
                                <Label>Preço de Venda</Label>
                                <Input type="number" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} required />
                            </div>
                        </div>
                        <div>
                            <Label>Foto do Produto</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) setPhotoFile(file)
                                }}
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {uploading ? 'Fazendo upload...' : 'Selecione uma imagem do seu computador'}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Cadastrar Produto</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Movimentação */}
            <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Movimentar Estoque: {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMovement} className="space-y-4">
                        <div>
                            <Label>Tipo de Movimentação</Label>
                            <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Entrada (Compra)</SelectItem>
                                    <SelectItem value="saida">Saída (Uso)</SelectItem>
                                    <SelectItem value="ajuste">Ajuste (Inventário)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Quantidade {movementType === 'ajuste' ? '(Novo Total)' : ''}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                required
                                placeholder={selectedProduct ? `Estoque atual: ${selectedProduct.current_stock}` : ''}
                            />
                        </div>
                        <div>
                            <Label>Observações</Label>
                            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Compra fornecedor X" />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Confirmar Movimentação</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
