export default function LoadingSpinner({ size = 'md', label }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeMap[size]} rounded-full border-accent/30 border-t-accent animate-spin`} />
      {label && <p className="text-text-secondary text-sm">{label}</p>}
    </div>
  )
}
