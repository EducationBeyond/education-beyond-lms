import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    console.log('[API Upload] Session check:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      userId: session?.user?.id 
    });
    
    if (!session?.user?.email) {
      console.log('[API Upload] Unauthorized: No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large' }, { status: 400 });
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // 実際のファイル保存実装（開発環境用）
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名を生成（ユーザーIDとタイムスタンプで一意にする）
    const userId = session.user.email?.replace(/[@.]/g, '_') || session.user.id || 'anonymous';
    const fileExtension = path.extname(file.name);
    const fileName = `${userId}-${Date.now()}${fileExtension}`;
    
    // public/uploads に保存
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', fileName);
    await writeFile(uploadPath, buffer);
    
    // 公開URLを生成
    const imageUrl = `/uploads/${fileName}`;
    
    console.log('[API Upload] File saved successfully:', {
      fileName,
      filePath: uploadPath,
      imageUrl,
      fileSize: buffer.length,
      fileType: file.type
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}