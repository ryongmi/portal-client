import Layout from '@/components/layout/Layout'

export default function AdminPage(): JSX.Element {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            관리자 대시보드
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">인증 서비스</h3>
              <p className="text-blue-600">사용자 및 OAuth 관리</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-700 mb-2">인가 서비스</h3>
              <p className="text-green-600">역할 및 권한 관리</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">포탈 서비스</h3>
              <p className="text-purple-600">서비스 통합 관리</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}