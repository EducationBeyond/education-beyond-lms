export default function StudentPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">生徒ダッシュボード</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-gray-600">生徒専用ページです。</p>
          <p className="mt-2 text-sm text-gray-500">
            このページは生徒でログインした場合にのみアクセスできます。
          </p>
        </div>
      </div>
    </div>
  );
}