'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type PhotoType = 'before' | 'after'

interface Photo {
    id: string
    photo_url: string
    photo_type: PhotoType
    uploaded_at: string
    notes?: string
}

export function PhotoUploader({
    appointmentId,
    onPhotosUpdated
}: {
    appointmentId: string
    onPhotosUpdated?: () => void
}) {
    const [uploading, setUploading] = useState(false)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [loading, setLoading] = useState(false)

    const loadPhotos = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('appointment_photos')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('uploaded_at', { ascending: true })

            if (error) throw error
            setPhotos(data || [])
        } catch (error: any) {
            toast.error('Erro ao carregar fotos: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        photoType: PhotoType
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar tamanho (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Arquivo muito grande! Máximo 5MB')
            return
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast.error('Apenas imagens são permitidas!')
            return
        }

        setUploading(true)
        try {
            // Upload para Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${appointmentId}/${photoType}/${Date.now()}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('appointment-photos')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('appointment-photos')
                .getPublicUrl(fileName)

            // Salvar no banco
            const { error: dbError } = await supabase
                .from('appointment_photos')
                .insert({
                    appointment_id: appointmentId,
                    photo_url: publicUrl,
                    photo_type: photoType
                })

            if (dbError) throw dbError

            toast.success(`Foto ${photoType === 'before' ? 'antes' : 'depois'} enviada!`)
            loadPhotos()
            onPhotosUpdated?.()
        } catch (error: any) {
            toast.error('Erro ao enviar foto: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (photoId: string, photoUrl: string) => {
        if (!confirm('Deseja realmente excluir esta foto?')) return

        try {
            // Extrair caminho do arquivo da URL
            const urlParts = photoUrl.split('/appointment-photos/')
            if (urlParts.length > 1) {
                const filePath = urlParts[1]

                // Deletar do storage
                await supabase.storage
                    .from('appointment-photos')
                    .remove([filePath])
            }

            // Deletar do banco
            const { error } = await supabase
                .from('appointment_photos')
                .delete()
                .eq('id', photoId)

            if (error) throw error

            toast.success('Foto excluída!')
            loadPhotos()
            onPhotosUpdated?.()
        } catch (error: any) {
            toast.error('Erro ao excluir foto: ' + error.message)
        }
    }

    // Carregar fotos ao montar
    useState(() => {
        loadPhotos()
    })

    const beforePhotos = photos.filter(p => p.photo_type === 'before')
    const afterPhotos = photos.filter(p => p.photo_type === 'after')

    return (
        <div className="space-y-4">
            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-4">
                {/* Upload Antes */}
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, 'before')}
                        disabled={uploading}
                        className="hidden"
                        id="upload-before"
                    />
                    <label htmlFor="upload-before" className="block">
                        <Button
                            variant="outline"
                            disabled={uploading}
                            className="w-full"
                            asChild
                        >
                            <span>
                                {uploading ? 'Enviando...' : 'Upload Antes'}
                                <Upload className="ml-2 h-4 w-4" />
                            </span>
                        </Button>
                    </label>
                </div>

                {/* Upload Depois */}
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, 'after')}
                        disabled={uploading}
                        className="hidden"
                        id="upload-after"
                    />
                    <label htmlFor="upload-after" className="block">
                        <Button
                            variant="outline"
                            disabled={uploading}
                            className="w-full"
                            asChild
                        >
                            <span>
                                {uploading ? 'Enviando...' : 'Upload Depois'}
                                <Upload className="ml-2 h-4 w-4" />
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {/* Galeria de Fotos */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">
                    Carregando fotos...
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Fotos Antes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Antes ({beforePhotos.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {beforePhotos.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                                    <p className="text-sm">Nenhuma foto</p>
                                </div>
                            ) : (
                                beforePhotos.map(photo => (
                                    <div key={photo.id} className="relative group">
                                        <Image
                                            src={photo.photo_url}
                                            alt="Antes"
                                            width={200}
                                            height={200}
                                            className="w-full h-40 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => handleDelete(photo.id, photo.photo_url)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Fotos Depois */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Depois ({afterPhotos.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {afterPhotos.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                                    <p className="text-sm">Nenhuma foto</p>
                                </div>
                            ) : (
                                afterPhotos.map(photo => (
                                    <div key={photo.id} className="relative group">
                                        <Image
                                            src={photo.photo_url}
                                            alt="Depois"
                                            width={200}
                                            height={200}
                                            className="w-full h-40 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => handleDelete(photo.id, photo.photo_url)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
