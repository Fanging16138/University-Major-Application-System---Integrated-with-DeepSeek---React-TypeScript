"use client"

import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import ComparisonModal from "./comparison-modal"
import Link from "next/link"

interface Major {
  code: string
  name: string
}

interface Subject {
  code: string
  name: string
  majors: Major[]
}

interface Category {
  code: string
  name: string
  subjects: Subject[]
}

const gradientColors = [
  "bg-gradient-to-br from-purple-200 via-pink-200 to-red-200",
  "bg-gradient-to-br from-green-200 to-blue-200",
  "bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200",
  "bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200",
  "bg-gradient-to-br from-green-200 via-cyan-200 to-blue-200",
  "bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200",
  "bg-gradient-to-br from-yellow-200 via-green-200 to-blue-200",
  "bg-gradient-to-br from-red-200 via-pink-200 to-black-200",
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("")
  const [majorData, setMajorData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/majors/hierarchy')
        const data = await response.json()
        setMajorData(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredData = majorData.map(category => ({
    ...category,
    subjects: category.subjects.map(subject => ({
      ...subject,
      majors: subject.majors.filter(major =>
        major.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(subject => subject.majors.length > 0)
  })).filter(category => category.subjects.length > 0)

  if (loading) {
    return <div className="container mx-auto p-4 text-center">加载中...</div>
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6 text-center text-black">探索大学专业</h1>

      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="搜索专业或类别"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="categories" className="mb-6">
        <TabsList className="justify-center">
          <TabsTrigger value="categories">专业类别</TabsTrigger>
          <TabsTrigger value="comparison">专业对比</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <Accordion type="single" collapsible className="w-full">
            {filteredData.map((category, categoryIndex) => (
              <AccordionItem key={category.code} value={category.code}>
                <AccordionTrigger className="text-lg font-semibold">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.subjects.map((subject, subjectIndex) => (
                      <AccordionItem key={subject.code} value={subject.code}>
                        <AccordionTrigger className="text-md font-medium">
                          {subject.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subject.majors.map((major, majorIndex) => (
                              <Card
                                key={major.code}
                                className={`${gradientColors[(categoryIndex + subjectIndex + majorIndex) % gradientColors.length]} overflow-hidden`}
                              >
                                <div className="backdrop-blur-sm bg-white/50 h-full">
                                  <CardHeader>
                                    <CardTitle className="text-black font-bold">{major.name}</CardTitle>
                                    <CardDescription className="text-gray-700">
                                      {category.name}/{subject.name}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <Button className="mt-2 bg-black/80 hover:bg-black text-white" asChild>
                                      <Link href={`/detail/${major.code}`}>了解更多</Link>
                                    </Button>
                                  </CardContent>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
        <TabsContent value="comparison">
          <ComparisonModal />
        </TabsContent>
      </Tabs>
    </main>
  )
} 