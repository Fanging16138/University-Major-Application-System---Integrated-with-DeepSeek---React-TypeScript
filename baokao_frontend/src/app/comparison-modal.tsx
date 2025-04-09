"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Select from 'react-select'

export default function ComparisonModal() {
  const [major1, setMajor1] = useState<string>("")
  const [major2, setMajor2] = useState<string>("")
  const [majors, setMajors] = useState<Array<{ code: string; name: string }>>([])
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/majors/hierarchy')
      .then(response => response.json())
      .then(data => {
        const flattenedMajors: Array<{ code: string; name: string }> = []
        data.forEach((category: any) => {
          category.subjects.forEach((subject: any) => {
            subject.majors.forEach((major: any) => {
              flattenedMajors.push({
                code: major.code,
                name: major.name
              })
            })
          })
        })
        setMajors(flattenedMajors)
      })
      .catch(error => console.error('Error fetching majors:', error))
  }, [])

  const handleCompare = () => {
    if (!major1 || !major2) {
      setError("！请填写专业")
      return
    }
    setError("")
    router.push(`/compare?major1=${major1}&major2=${major2}`)
  }

  const SearchableSelect = ({ 
    value, 
    onChange, 
    placeholder 
  }: { 
    value: string
    onChange: (value: string) => void
    placeholder: string 
  }) => {
    const options = majors.map(major => ({
      value: major.code,
      label: major.name
    }))

    return (
      <Select
        value={options.find(option => option.value === value)}
        onChange={(newValue: any) => onChange(newValue?.value || "")}
        options={options}
        placeholder={placeholder}
        isClearable
        isSearchable
        className="w-full"
        classNames={{
          control: (state) => 'bg-background !border-input hover:!border-ring',
          menu: () => 'bg-background border border-input',
          option: (state) => 
            state.isFocused 
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground',
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: 'var(--primary)',
            primary25: 'var(--accent)',
          },
        })}
      />
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-center text-2xl mb-6">专业对比</h2>
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center justify-center w-full space-x-4">
            <div className="w-2/5">
              <SearchableSelect
                value={major1}
                onChange={setMajor1}
                placeholder="选择专业"
              />
            </div>
            <div className="text-xl font-bold">VS</div>
            <div className="w-2/5">
              <SearchableSelect
                value={major2}
                onChange={setMajor2}
                placeholder="选择专业"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleCompare} 
            className="w-1/3"
          >
            比较
          </Button>
        </div>
      </div>
    </div>
  )
}