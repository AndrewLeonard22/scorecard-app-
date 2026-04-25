export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-7 bg-[#F1F1F1] rounded-lg w-40 mb-2" />
      <div className="h-4 bg-[#F1F1F1] rounded w-24 mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-[#F1F1F1] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 bg-[#F1F1F1] rounded-xl" />
        ))}
      </div>
    </main>
  )
}
