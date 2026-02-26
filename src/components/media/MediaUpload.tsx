'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  CheckCircle, 
  AlertCircle, 
  Camera,
  Play,
  Download,
  Share2,
  Trash2,
  Eye
} from 'lucide-react'

interface MediaFile {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface MediaUploadProps {
  type: 'MATCH_HIGHLIGHT' | 'MATCH_PHOTO' | 'TEAM_LOGO' | 'PLAYER_PHOTO' | 'GROUND_PHOTO' | 'TOURNAMENT_BANNER'
  entityId: string
  entityType: string
  onUploadComplete?: (media: any) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function MediaUpload({ 
  type, 
  entityId, 
  entityType, 
  onUploadComplete, 
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
}: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mediaTypes = {
    MATCH_HIGHLIGHT: { label: 'Match Highlight', icon: Video, color: 'bg-red-100 text-red-800' },
    MATCH_PHOTO: { label: 'Match Photo', icon: Camera, color: 'bg-blue-100 text-blue-800' },
    TEAM_LOGO: { label: 'Team Logo', icon: Image, color: 'bg-green-100 text-green-800' },
    PLAYER_PHOTO: { label: 'Player Photo', icon: Camera, color: 'bg-purple-100 text-purple-800' },
    GROUND_PHOTO: { label: 'Ground Photo', icon: Camera, color: 'bg-yellow-100 text-yellow-800' },
    TOURNAMENT_BANNER: { label: 'Tournament Banner', icon: Image, color: 'bg-orange-100 text-orange-800' },
  }

  const currentMediaType = mediaTypes[type]

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: MediaFile[] = []
    
    Array.from(selectedFiles).forEach(file => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return
      }

      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        
        const mediaFile: MediaFile = {
          id: Math.random().toString(36).substring(7),
          file,
          preview,
          progress: 0,
          status: 'pending'
        }

        setFiles(prev => {
          const updated = [...prev, mediaFile]
          return updated.slice(-maxFiles) // Keep only last maxFiles
        })
      }

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsDataURL(file) // For videos, we'll show a placeholder
      }
    })
  }, [acceptedTypes, maxFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      for (const mediaFile of files) {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        // Create form data
        const formData = new FormData()
        formData.append('file', mediaFile.file)
        formData.append('metadata', JSON.stringify({
          type,
          entityId,
          title: title || `${currentMediaType.label} - ${entityType}`,
          description,
          tags,
          isPublic
        }))

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.id === mediaFile.id && f.status === 'uploading') {
              const newProgress = Math.min(f.progress + 10, 90)
              return { ...f, progress: newProgress }
            }
            return f
          }))
        }, 200)

        // Upload file
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)

        if (response.ok) {
          const result = await response.json()
          
          // Update status to success
          setFiles(prev => prev.map(f => 
            f.id === mediaFile.id ? { ...f, status: 'success', progress: 100 } : f
          ))

          if (onUploadComplete) {
            onUploadComplete(result.media)
          }
        } else {
          const error = await response.json()
          
          // Update status to error
          setFiles(prev => prev.map(f => 
            f.id === mediaFile.id ? { ...f, status: 'error', error: error.error } : f
          ))
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      // Update all files to error
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error',
        error: 'Upload failed'
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" alt="Image file" />
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentMediaType.icon className="w-5 h-5" />
            Upload {currentMediaType.label}
          </CardTitle>
          <CardDescription>
            Upload {currentMediaType.label.toLowerCase()} for {entityType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-gray-600">
                  Accepted formats: {acceptedTypes.join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Maximum file size: 50MB • Maximum files: {maxFiles}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Selected Files ({files.length}/{maxFiles})</h4>
                {files.map((mediaFile) => (
                  <div key={mediaFile.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {/* Preview */}
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                      {mediaFile.file.type.startsWith('image/') ? (
                        <img 
                          src={mediaFile.preview} 
                          alt={mediaFile.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Video className="w-6 h-6" />
                          <span className="text-xs">Video</span>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{mediaFile.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(mediaFile.file.size)}
                      </p>
                      
                      {/* Progress */}
                      {mediaFile.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={mediaFile.progress} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">
                            {mediaFile.progress}% uploaded
                          </p>
                        </div>
                      )}
                      
                      {/* Status */}
                      <div className="flex items-center space-x-2 mt-1">
                        {mediaFile.status === 'pending' && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {mediaFile.status === 'uploading' && (
                          <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>
                        )}
                        {mediaFile.status === 'success' && (
                          <Badge className="bg-green-100 text-green-800 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        )}
                        {mediaFile.status === 'error' && (
                          <Badge className="bg-red-100 text-red-800 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                      
                      {mediaFile.error && (
                        <p className="text-xs text-red-600 mt-1">{mediaFile.error}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(mediaFile.id)}
                      disabled={mediaFile.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`${currentMediaType.label} - ${entityType}`}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this media..."
                  className="h-20"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isPublic">Make this media public</Label>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([])
                  setTitle('')
                  setDescription('')
                  setTags([])
                  setIsPublic(true)
                }}
              >
                Clear
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={files.length === 0 || isUploading || !title}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {files.length} File{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {files.length > 0 && files.every(f => f.status === 'success') && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            All files uploaded successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}