'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { inviteUser, updateProfile } from './actions'
import type { Profile } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserPlus, Pencil, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserManagementProps {
  profiles: Profile[]
}

const ROLE_LABELS: Record<string, string> = { csm: 'CSM', media_buyer: 'Media Buyer', csr: 'CSR', admin: 'Admin' }

function InviteDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', role: 'csr' })

  async function handleInvite() {
    if (!form.email || !form.fullName) { toast.error('Email and name required'); return }
    setLoading(true)
    const result = await inviteUser(form.email, form.fullName, form.role)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`Invited ${form.fullName}`)
    setOpen(false)
    setForm({ email: '', fullName: '', role: 'csr' })
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" /> Invite User
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Rory Smith" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="rory@socialworkspro.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v ?? 'csr' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csm">CSM</SelectItem>
                  <SelectItem value="media_buyer">Media Buyer</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EditUserDialog({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name,
    role: profile.role,
    weekly_bonus_target: String(profile.weekly_bonus_target ?? 0),
    ramp_end_date: profile.ramp_end_date ?? '',
    active: profile.active,
  })

  async function handleSave() {
    setLoading(true)
    const result = await updateProfile(profile.id, {
      full_name: form.full_name,
      role: form.role,
      weekly_bonus_target: parseFloat(form.weekly_bonus_target) || 0,
      ramp_end_date: form.ramp_end_date || null,
      active: form.active,
    })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Profile updated')
    setOpen(false)
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(true)}>
        <Pencil className="h-3 w-3" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {profile.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: (v ?? 'csr') as Profile['role'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csm">CSM</SelectItem>
                  <SelectItem value="media_buyer">Media Buyer</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Weekly Bonus Target ($)</Label>
              <Input type="number" min="0" value={form.weekly_bonus_target} onChange={e => setForm(p => ({ ...p, weekly_bonus_target: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Ramp End Date <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="date" value={form.ramp_end_date} onChange={e => setForm(p => ({ ...p, ramp_end_date: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Soft floor waived until this date</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`active-${profile.id}`} checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="rounded" />
              <Label htmlFor={`active-${profile.id}`}>Active</Label>
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function UserManagement({ profiles }: UserManagementProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Weekly Target</TableHead>
            <TableHead>Ramp Until</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
              <TableCell>{ROLE_LABELS[p.role]}</TableCell>
              <TableCell>{p.weekly_bonus_target ? `$${p.weekly_bonus_target}` : '—'}</TableCell>
              <TableCell>{p.ramp_end_date ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={p.active ? 'default' : 'secondary'} className={cn('text-xs', p.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : '')}>
                  {p.active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell><EditUserDialog profile={p} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
