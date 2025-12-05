'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

type Photo = {
    id: string
    photo_type: 'before' | 'after'
    photo_url: string
    uploaded_at: string
}

type PhotoGalleryProps = {
    appointmentId: string
}

export function PhotoGallery({ appointmentId }: PhotoGalleryProps) {
    const [photos, setPhotos] = useState<Photo[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPhotos()
    }, [appointmentId])

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`/api/photos?appointmentId=${appointmentId}`)
            const data = await res.json()
            setPhotos(data.photos || [])
        } catch (error) {
            console.error('Erro ao buscar fotos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (file: File, type: 'before' | 'after') => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('appointmentId', appointmentId)
            formData.append('photoType', type)

            const res = await fetch('/api/photos', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Erro no upload')

            await fetchPhotos()
            alert('Foto adicionada com sucesso!')
        } catch (error) {
            console.error('Erro no upload:', error)
            alert('Erro ao fazer upload da foto')
        } finally {
            setUploading(false)
        }
    }

    const beforePhotos = photos.filter(p => p.photo_type === 'before')
    const afterPhotos = photos.filter(p => p.photo_type === 'after')

    if (loading) return <div className="text-sm text-gray-500">Carregando fotos...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ImageIcon size={16} />
                <span>Fotos do Atendimento</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Coluna ANTES */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">ANTES</h4>
                    <div className="space-y-2">
                        {beforePhotos.map(photo => (
                            <Card key={photo.id} className="p-2 relative group">
                                <Image
                                    src={photo.photo_url}
                                    alt="Antes"
                                    width={200}
                                    height={200}
                                    className="w-full h-32 object-cover rounded"
                                />
                            </Card>
                        ))}

                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleUpload(file, 'before')
                                }}
                                disabled={uploading}
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors flex flex-col items-center justify-center h-32">
                                <Upload size={24} className="text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">Adicionar foto ANTES</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Coluna DEPOIS */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">DEPOIS</h4>
                    <div className="space-y-2">
                        {afterPhotos.map(photo => (
                            <Card key={photo.id} className="p-2 relative group">
                                <Image
                                    src={photo.photo_url}
                                    alt="Depois"
                                    width={200}
                                    height={200}
                                    className="w-full h-32 object-cover rounded"
                                />
                            </Card>
                        ))}

                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleUpload(file, 'after')
                                }}
                                disabled={uploading}
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors flex flex-col items-center justify-center h-32">
                                <Upload size={24} className="text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">Adicionar foto DEPOIS</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {uploading && (
                <div className="text-center text-sm text-gray-500">Fazendo upload...</div>
            )}
        </div>
    )
}
