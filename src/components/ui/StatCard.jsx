export default function StatCard({ icon: Icon, label, value, trend, color = 'accent' }) {
  const colorMap = {
    accent: 'bg-accent/15 text-accent-light',
    success: 'bg-status-success/15 text-status-success',
    warning: 'bg-status-warning/15 text-status-warning',
    info: 'bg-status-info/15 text-status-info',
  }

  return (
    <div className="card-hover cursor-default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p className="text-text-muted text-xs mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
