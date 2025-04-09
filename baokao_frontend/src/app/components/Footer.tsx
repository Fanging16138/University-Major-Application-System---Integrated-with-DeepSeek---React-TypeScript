import Link from "next/link"

const Footer = () => {
  return (
    <footer className="bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <span className="text-2xl font-bold text-blue-600">大学专业探索</span>
            <p className="text-gray-500 text-base">帮助学生了解和选择适合自己的大学专业</p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">专业类别</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/majors/engineering" className="text-base text-gray-500 hover:text-gray-900">
                      工程类
                    </Link>
                  </li>
                  <li>
                    <Link href="/majors/science" className="text-base text-gray-500 hover:text-gray-900">
                      理学类
                    </Link>
                  </li>
                  <li>
                    <Link href="/majors/liberal-arts" className="text-base text-gray-500 hover:text-gray-900">
                      文学类
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">资源</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/resources/guides" className="text-base text-gray-500 hover:text-gray-900">
                      专业选择指南
                    </Link>
                  </li>
                  <li>
                    <Link href="/resources/career-paths" className="text-base text-gray-500 hover:text-gray-900">
                      职业发展路径
                    </Link>
                  </li>
                  <li>
                    <Link href="/resources/faq" className="text-base text-gray-500 hover:text-gray-900">
                      常见问题
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">&copy; 2023 大学专业探索. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

