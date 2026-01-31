'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageIcon, Upload, Link2 } from 'lucide-react'

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string) => void
  folder?: string
  tags?: string[]
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onInsert,
  folder = 'blog/content',
  tags = ['blog', 'content'],
}: ImageUploadDialogProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [imageError, setImageError] = useState(false)

  const handleInsert = () => {
    const url = activeTab === 'upload' ? imageUrl : urlInput.trim()
    if (url) {
      onInsert(url)
      setImageUrl('')
      setUrlInput('')
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setImageUrl('')
    setUrlInput('')
    setImageError(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image or paste an image URL to insert into your content
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              folder={folder}
              tags={tags}
              showUrlInput={false}
              previewHeight={200}
              onUploadSuccess={(result) => {
                setImageUrl(result.url)
              }}
            />
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setImageError(false)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Paste the URL of an image to insert it into your content
              </p>
            </div>
            {urlInput && !imageError && (
              <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={urlInput}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
            )}
            {urlInput && imageError && (
              <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Failed to load image
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            disabled={!imageUrl && !urlInput.trim()}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
