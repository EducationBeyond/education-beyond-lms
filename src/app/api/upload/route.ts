import { NextRequest, NextResponse } from 'next/server';
import { auth as nextAuth } from '@/auth';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await nextAuth();

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

    // ファイルデータの準備
    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    console.log('[API Upload] Original image:', {
      originalSize: originalBuffer.length,
      fileType: file.type
    });

    // 画像を圧縮（プロフィール画像用に最適化）
    const compressedBuffer = await sharp(originalBuffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer();

    console.log('[API Upload] Image compressed:', {
      originalSize: originalBuffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: Math.round((1 - compressedBuffer.length / originalBuffer.length) * 100) + '%'
    });

    // ファイル名を生成（ユーザーIDとタイムスタンプで一意にする）
    const userId = session.user.email?.replace(/[@.]/g, '_') || session.user.id || 'anonymous';
    const fileName = `${userId}-${Date.now()}.jpg`; // 圧縮後はJPEGに統一

    // 一時的にすべての環境でBase64を使用（Google Drive認証問題のため）
    if (true || process.env.VERCEL || !process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      console.log('[API Upload] Using Base64 storage with compression');

      const base64 = compressedBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      console.log('[API Upload] File compressed and converted to Base64 successfully:', {
        fileName,
        originalSize: originalBuffer.length,
        finalSize: compressedBuffer.length,
        base64Length: base64.length,
        compressionRatio: Math.round((1 - compressedBuffer.length / originalBuffer.length) * 100) + '%'
      });

      return NextResponse.json({ imageUrl: dataUrl });
    }

    // Google Drive APIを使用したアップロード（圧縮済み画像）
    console.log('[API Upload] Using Google Drive API with compression');

    // サービスアカウント認証またはApplication Default Credentials
    let googleAuth;

    if (process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      // サービスアカウント認証（Vercel用）
      googleAuth = new google.auth.JWT(
        process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive.file']
      );
    } else {
      // Application Default Credentials（開発環境用）
      googleAuth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    }

    const drive = google.drive({ version: 'v3', auth: googleAuth });

    // Google Driveにアップロード（圧縮済み画像）
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'],
    };

    const media = {
      mimeType: 'image/jpeg',
      body: compressedBuffer,
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink,webContentLink',
    });

    // ファイルを公開設定にする
    await drive.permissions.create({
      fileId: uploadResponse.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 公開URLを生成（直接表示用）
    const imageUrl = `https://drive.google.com/uc?id=${uploadResponse.data.id}&export=view`;

    console.log('[API Upload] Compressed file uploaded to Google Drive successfully:', {
      fileName,
      fileId: uploadResponse.data.id,
      imageUrl,
      originalSize: originalBuffer.length,
      finalSize: compressedBuffer.length,
      compressionRatio: Math.round((1 - compressedBuffer.length / originalBuffer.length) * 100) + '%'
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}