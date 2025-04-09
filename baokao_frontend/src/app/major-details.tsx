interface MajorDetailsProps {
  major: string;
}

export default function MajorDetails({ major }: MajorDetailsProps) {
  return (
    <div className="text-gray-800">
      <p>这里是关于 {major} 的简要介绍。</p>
      {/* 可以添加更多详细信息，如就业前景、核心课程等 */}
    </div>
  )
}

