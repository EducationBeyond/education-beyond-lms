import Link from 'next/link';
import { Users, UserCheck, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">管理者ダッシュボード</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ユーザー管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ユーザー管理
              </CardTitle>
              <CardDescription>
                学生、保護者、チューターの管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full">
                  ユーザー一覧
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* マッチング管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                マッチング管理
              </CardTitle>
              <CardDescription>
                学生とチューターのマッチング
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/matching">
                <Button className="w-full">
                  マッチング登録
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* システム設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                システム設定
              </CardTitle>
              <CardDescription>
                アプリケーションの設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                準備中
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">管理機能について</h2>
          <div className="space-y-2 text-gray-600">
            <p>• <strong>ユーザー管理</strong>: 登録されたユーザーの一覧表示と管理</p>
            <p>• <strong>マッチング管理</strong>: 事前面談が完了した学生とチューターをマッチング</p>
            <p>• <strong>システム設定</strong>: アプリケーションの各種設定（今後実装予定）</p>
          </div>
        </div>
      </div>
    </div>
  );
}