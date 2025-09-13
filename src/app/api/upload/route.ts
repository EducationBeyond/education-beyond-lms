import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
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

    // TODO: 実際のSupabase Storage連携実装
    // 現在はスタブとしてダミーURLを返す
    // 実装時には以下の処理が必要：
    // 1. Supabaseクライアントの初期化
    // 2. ファイルのアップロード
    // 3. 公開URLの取得
    // 4. プロフィール画像URLをデータベースに保存

    /*
    import { createClient } from '@supabase/supabase-js';
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `${session.user.id}-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file);

    if (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    */

    // スタブ実装: ダミーURLを返す
    const imageUrl = `/api/placeholder-image?user=${session.user.id}&timestamp=${Date.now()}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}