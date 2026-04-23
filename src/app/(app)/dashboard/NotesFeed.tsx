import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Note {
  notes: string | null
  week_start: string
  submitted_at: string
  profiles: { full_name: string; role: string } | null
}

export function NotesFeed({ notes }: { notes: Note[] }) {
  const filtered = notes.filter(n => n.notes && n.notes.trim())

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Team Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes this period</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((note, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium">{note.profiles?.full_name ?? 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.submitted_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{note.notes}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
