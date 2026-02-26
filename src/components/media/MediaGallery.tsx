'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Eye, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Calendar,
  User,
  Play,
  X
} from 'lucide-react'

interface MediaItem {
  id: string
  type: string
  entityId: string
  title: string
  description?: string
  fileName: string
  filePath: string
  mimeType: string
  fileSize: number
  tags: string[]
  isPublic: boolean
  createdAt: string
  uploadedBy: string
}

interface MediaGalleryProps {
  type?: string
  entityId?: string
  showUploadButton?: boolean
}

export function MediaGallery({ type, entityId, showUploadButton = true }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState(type || '')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)

  const mediaTypes = [
    { value: '', label: 'All Types' },
    { value: 'MATCH_HIGHLIGHT', label: 'Match Highlights' },
    { value: 'MATCH_PHOTO', label: 'Match Photos' },
    { value: 'TEAM_LOGO', label: 'Team Logos' },
    { value: 'PLAYER_PHOTO', label: 'Player Photos' },
    { value: 'GROUND_PHOTO', label: 'Ground Photos' },
    { value: 'TOURNAMENT_BANNER', label: 'Tournament Banners' },
  ]

  useEffect(() => {
    fetchMedia()
  }, [searchTerm, selectedType, entityId])

  const fetchMedia = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType) params.append('type', selectedType)
      if (entityId) params.append('entityId', entityId)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/media/upload?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMedia(data.media)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (mediaItem: MediaItem) => {
    try {
      const response = await fetch(mediaItem.filePath)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mediaItem.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleShare = async (mediaItem: MediaItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mediaItem.title,
          text: mediaItem.description || `Check out this ${mediaItem.type.replace('_', ' ').toLowerCase()}`,
          url: window.location.origin + mediaItem.filePath,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback - copy to clipboard
      const shareText = `${mediaItem.title}\n${mediaItem.description || ''}\n${window.location.origin + mediaItem.filePath}`
      navigator.clipboard.writeText(shareText)
      alert('Link copied to clipboard!')
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) {
      return
    }

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMedia(prev => prev.filter(item => item.id !== mediaId))
      }
    } catch (error) {
      console.error('Error deleting media:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMedia = media.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = !selectedType || item.type === selectedType
    
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Media Gallery</h2>
          <p className="text-gray-600">Manage and view your media files</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Media</Label>
              <Input
                id="search"
                placeholder="Search by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type-filter">Filter by Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {mediaTypes.map(mediaType => (
                    <SelectItem key={mediaType.value} value={mediaType.value}>
                      {mediaType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredMedia.length} files found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMedia.map((mediaItem) => (
          <Card key={mediaItem.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
            {/* Preview */}
            <div className="relative aspect-video bg-gray-100">
              {mediaItem.mimeType.startsWith('image/') ? (
                <img
                  src={mediaItem.filePath}
                  alt={mediaItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Video className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Type Badge */}
              <div className="absolute top-2 left-2">
                <Badge className="bg-black bg-opacity-50 text-white">
                  {mediaItem.type.replace('_', ' ')}
                </Badge>
              </div>

              {/* Play Button for Videos */}
              {mediaItem.mimeType.startsWith('video/') && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedItem(mediaItem)
                      setShowViewDialog(true)
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2">{mediaItem.title}</h3>
                
                {mediaItem.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{mediaItem.description}</p>
                )}

                {/* Tags */}
                {mediaItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mediaItem.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {mediaItem.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{mediaItem.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(mediaItem.fileSize)}</span>
                  <span>{formatDate(mediaItem.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t mt-3">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(mediaItem)
                      setShowViewDialog(true)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(mediaItem)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(mediaItem)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(mediaItem.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedType
                ? 'Try adjusting your filters or search terms'
                : 'Upload your first media file to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>{selectedItem?.title}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {selectedItem.mimeType.startsWith('image/') ? (
                  <img
                    src={selectedItem.filePath}
                    alt={selectedItem.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedItem.filePath}
                    controls
                    className="w-full h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Media Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium">{selectedItem.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-600">File Size</p>
                  <p className="font-medium">{formatFileSize(selectedItem.fileSize)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Uploaded</p>
                  <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Visibility</p>
                  <p className="font-medium">{selectedItem.isPublic ? 'Public' : 'Private'}</p>
                </div>
              </div>

              {selectedItem.description && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">Description</p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
              )}

              {selectedItem.tags.length > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleDownload(selectedItem)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => handleShare(selectedItem)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}