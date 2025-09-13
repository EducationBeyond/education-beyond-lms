'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (imageUrl: string) => void;
}

export function ImageUpload({ currentImageUrl, onImageUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 実際のアップロード処理（Supabase Storage連携が必要）
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました');
      }

      const { imageUrl } = await response.json();
      onImageUpload(imageUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール画像</CardTitle>
        <CardDescription>
          JPG、PNG形式で5MB以下のファイルをアップロードできます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center space-y-4">
          {previewUrl && (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
              <img
                src={previewUrl}
                alt="プロフィール画像"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            onClick={handleButtonClick}
            disabled={isUploading}
            variant="outline"
          >
            {isUploading ? 'アップロード中...' : '画像を選択'}
          </Button>

          {previewUrl && (
            <p className="text-sm text-muted-foreground">
              画像をプレビュー表示中です
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• 推奨サイズ: 400x400px以上</p>
          <p>• ファイル形式: JPG, PNG</p>
          <p>• 最大ファイルサイズ: 5MB</p>
        </div>
      </CardContent>
    </Card>
  );
}