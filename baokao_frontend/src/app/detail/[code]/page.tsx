"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { majorsData, type MajorData } from "@/app/data/majorsData"

interface QA {
  question: string
  answer: string
}

interface MajorHierarchy {
  code: string
  name: string
  subjects: Array<{
    code: string
    name: string
    majors: Array<{
      code: string
      name: string
    }>
  }>
}

export default function MajorDetail({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const [newQuestion, setNewQuestion] = useState("")
  const majorInfo: MajorData | undefined = majorsData[resolvedParams.code as keyof typeof majorsData]
  const [showAllCourses, setShowAllCourses] = useState(false)
  const [majorCodes, setMajorCodes] = useState<Record<string, string>>({})
  const [questions, setQuestions] = useState<QA[]>(majorInfo?.qa.slice(0, 3) || [])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/majors/hierarchy')
      .then(res => res.json())
      .then((data: MajorHierarchy[]) => {
        const codeMap: Record<string, string> = {}
        data.forEach(category => {
          category.subjects.forEach(subject => {
            subject.majors.forEach(major => {
              codeMap[major.name] = major.code
            })
          })
        })
        setMajorCodes(codeMap)
      })
      .catch(error => console.error('获取专业代码失败:', error))
  }, [])

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newQuestion.trim()) {
      try {
        setIsLoading(true)
        // 立即添加问题到列表，答案显示为加载中
        const newQA = { 
          question: newQuestion, 
          answer: "DeepSeek正在思考中..." 
        }
        setQuestions(prev => [...prev, newQA])
        
        const response = await fetch('http://localhost:5000/api/major/qa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            major_name: majorInfo?.name,
            question: newQuestion
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '回答问题失败')
        }

        if (!response.body) {
          throw new Error('没有响应数据')
        }

        const reader = response.body.getReader()
        let answer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const text = new TextDecoder().decode(value)
          try {
            const jsonResponse = JSON.parse(text)
            // 移除think标签之间的内容
            const cleanAnswer = jsonResponse.answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
            answer = cleanAnswer
            
            setQuestions(prev => prev.map((q, i) => 
              i === prev.length - 1 ? { ...q, answer } : q
            ))
          } catch (e) {
            // 如果不是JSON格式，直接使用文本
            answer += text
            setQuestions(prev => prev.map((q, i) => 
              i === prev.length - 1 ? { ...q, answer } : q
            ))
          }
        }

        setNewQuestion("")
      } catch (error) {
        console.error("提交问题失败:", error)
        setQuestions(prev => prev.map((q, i) => 
          i === prev.length - 1 
            ? { ...q, answer: `抱歉，获取回答时出现错误: ${error instanceof Error ? error.message : '未知错误'}` } 
            : q
        ))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDeleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  if (!majorInfo) {
    return <div>专业信息不存在</div>
  }

  const displayedCourses = showAllCourses ? majorInfo.courses : majorInfo.courses.slice(0, 5)

  return (
    <div className="container mx-auto p-4">
      <Link href="/" className="flex items-center text-blue-500 hover:underline mb-4">
        <ArrowLeft className="mr-2" size={20} />
        返回首页
      </Link>

      {/* 修改基础信息卡片的布局 */}
      <div className="mb-8">
        <Card className="inline-block bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{majorInfo.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-gray-600"><span className="font-semibold">专业代码：</span>{majorInfo.code}</p>
              <p className="text-gray-600"><span className="font-semibold">所属门类：</span>{majorInfo.category}</p>
              <p className="text-gray-600"><span className="font-semibold">所属学科：</span>{majorInfo.subject}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要课程 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">主要课程</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {displayedCourses.map((course, index) => (
            <Card key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 transform hover:scale-105 transition-transform duration-200">
              <CardHeader>
                <CardTitle className="text-sm text-center">{course}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
        {majorInfo.courses.length > 5 && (
          <Button 
            variant="outline" 
            onClick={() => setShowAllCourses(!showAllCourses)}
            className="w-full"
          >
            {showAllCourses ? "显示较少" : "查看更多课程"}
          </Button>
        )}
      </section>

      {/* 相似专业 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">相似专业</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {majorInfo.similarMajors.map((major, index) => (
            <Link href={`/detail/${majorCodes[major] || '#'}`} key={index}>
              <Card className="bg-gradient-to-br from-blue-100 to-purple-100 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm text-center">{major}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 就业前景 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">就业前景</h2>
        <Card className="bg-gradient-to-br from-green-50 to-teal-50">
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">{majorInfo.careerProspects}</p>
          </CardContent>
        </Card>
      </section>

      {/* Q&A栏目 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Q&A</h2>
        <div className="space-y-4 mb-6">
          {questions.map((qa, index) => (
            <Card key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 relative">
              <button
                onClick={() => handleDeleteQuestion(index)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                aria-label="删除问题"
              >
                <X size={18} className="text-red-500" />
              </button>
              <CardHeader>
                <CardTitle className="text-md">Q: {qa.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  A: {qa.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-lg">提出新问题</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitQuestion}>
              <Textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="输入你的问题..."
                className="mb-2"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "提交中..." : "提交问题"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
} 