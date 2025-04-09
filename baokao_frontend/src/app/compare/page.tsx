"use client"

import { useState } from "react"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts"
import { majorsData } from "@/app/data/majorsData"
import { useSearchParams } from "next/navigation"

// 模拟数据保持不变
const salaryRanges = {
  "010101": [8000, 15000],
  "010102": [7000, 14000],
}

const jobProspects = {
  "010101": 85,
  "010102": 80,
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const major1 = searchParams.get("major1")
  const major2 = searchParams.get("major2")
  const [activeTab, setActiveTab] = useState("overall")

  if (!major1 || !major2) {
    return <div className="container mx-auto p-4 text-center">缺少比较参数</div>
  }

  const majorData1 = majorsData[major1 as keyof typeof majorsData]
  const majorData2 = majorsData[major2 as keyof typeof majorsData]

  if (!majorData1 || !majorData2) {
    return <div className="container mx-auto p-4 text-center">专业信息不存在</div>
  }

  const radarData = [
    {
      subject: "就业前景",
      A: jobProspects[major1 as keyof typeof jobProspects],
      B: jobProspects[major2 as keyof typeof jobProspects],
    },
    {
      subject: "高薪",
      A: salaryRanges[major1 as keyof typeof salaryRanges][1],
      B: salaryRanges[major2 as keyof typeof salaryRanges][1],
    },
    { subject: "课程数量", A: majorData1.courses.length, B: majorData2.courses.length },
    { subject: "相关专业数", A: majorData1.similarMajors.length, B: majorData2.similarMajors.length },
  ]

  const coursesData = majorData1.courses
    .map((course) => ({
      name: course,
      [majorData1.name]: 1,
      [majorData2.name]: majorData2.courses.includes(course) ? 1 : 0,
    }))
    .concat(
      majorData2.courses
        .filter((course) => !majorData1.courses.includes(course))
        .map((course) => ({
          name: course,
          [majorData1.name]: 0,
          [majorData2.name]: 1,
        })),
    )

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `专业对比: ${majorData1.name} vs ${majorData2.name}`,
        url: window.location.href,
      })
    } else {
      alert("分享功能不可用")
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([JSON.stringify({ majorData1, majorData2, radarData, coursesData })], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${majorData1.name}_vs_${majorData2.name}_comparison.json`
    document.body.appendChild(element)
    element.click()
  }

  return (
    <div className="container mx-auto p-4 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Link
        href="/"
        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-6"
      >
        <ArrowLeft className="mr-2" size={20} />
        <span className="text-lg font-semibold">返回首页</span>
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">
          专业对比: {majorData1.name} vs {majorData2.name}
        </h1>
        <div className="space-x-2">
          <Button onClick={handleShare} variant="outline" className="bg-white">
            <Share2 className="mr-2 h-4 w-4" /> 分享
          </Button>
          <Button onClick={handleDownload} variant="outline" className="bg-white">
            <Download className="mr-2 h-4 w-4" /> 下载数据
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall">总体对比</TabsTrigger>
          <TabsTrigger value="courses">课程对比</TabsTrigger>
        </TabsList>
        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle>总体对比</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 150000]} />
                  <Radar name={majorData1.name} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name={majorData2.name} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>课程对比</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coursesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 1]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={majorData1.name} fill="#8884d8" />
                  <Bar dataKey={majorData2.name} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">{majorData1.name} 详情</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2 text-lg text-blue-700">主要课程:</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              {majorData1.courses.map((course, index) => (
                <li key={index}>{course}</li>
              ))}
            </ul>
            <h3 className="font-semibold mb-2 text-lg text-blue-700">相关工作:</h3>
            <p className="text-gray-700">
              就业前景评分:{" "}
              <span className="font-bold text-green-600">{jobProspects[major1 as keyof typeof jobProspects]}/100</span>
            </p>
            <p className="text-gray-700">
              薪资范围:{" "}
              <span className="font-bold text-green-600">
                ¥{salaryRanges[major1 as keyof typeof salaryRanges][0]} - ¥
                {salaryRanges[major1 as keyof typeof salaryRanges][1]}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">{majorData2.name} 详情</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2 text-lg text-blue-700">主要课程:</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              {majorData2.courses.map((course, index) => (
                <li key={index}>{course}</li>
              ))}
            </ul>
            <h3 className="font-semibold mb-2 text-lg text-blue-700">相关工作:</h3>
            <p className="text-gray-700">
              就业前景评分:{" "}
              <span className="font-bold text-green-600">{jobProspects[major2 as keyof typeof jobProspects]}/100</span>
            </p>
            <p className="text-gray-700">
              薪资范围:{" "}
              <span className="font-bold text-green-600">
                ¥{salaryRanges[major2 as keyof typeof salaryRanges][0]} - ¥
                {salaryRanges[major2 as keyof typeof salaryRanges][1]}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

