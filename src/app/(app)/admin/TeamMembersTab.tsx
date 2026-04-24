'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile, Role } from '@/lib/types/database'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'csm', label: 'CSM' },
  { value: 'media_buyer', label: 'Media Buyer' },
  { value: 'csr', label: 'CSR / Setter' },
]

interface TeamMembersTabProps {
  profiles: Profile[]
  currentUserId: string
}

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export function TeamMembersTab({ profiles: initialProfiles, currentUserId }: TeamMembersTabProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteText, setDeleteText] = useState('')
  const [inviting, setInviting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'csr' as Role })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (PREVIEW) { toast.info('Preview mode — invite not sent'); setInviteOpen(false); return }
    setInviting(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invite failed')
      toast.success(`Invite sent to ${inviteForm.email}`)
      setInviteOpen(false)
      setInviteForm({ name: '', email: '', role: 'csr' })
      // Refresh profiles list
      const profilesRes = await fetch('/api/admin/profiles')
      if (profilesRes.ok) setProfiles(await profilesRes.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  async function toggleActive(profile: Profile) {
    if (profile.id === currentUserId) {
      toast.error("You can't deactivate your own account.")
      return
    }
    if (PREVIEW) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, active: !p.active } : p))
      return
    }
    const res = await fetch('/api/admin/profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profile.id, active: !profile.active }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, active: !p.active } : p))
    toast.success(profile.active ? 'User deactivated' : 'User activated')
  }

  async function handleRoleChange(profileId: string, newRole: Role) {
    if (profileId === currentUserId && newRole !== 'admin') {
      if (!confirm('Changing your own role from Admin will remove your admin access. Continue?')) return
    }
    if (PREVIEW) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p))
      return
    }
    const res = await fetch('/api/admin/profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profileId, role: newRole }),
    })
    if (!res.ok) { toast.error('Failed to update role'); return }
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p))
    toast.success('Role updated')
  }

  async function handleDelete(id: string) {
    if (deleteText !== 'DELETE') return
    if (id === currentUserId) { toast.error("Can't delete your own account."); return }
    if (PREVIEW) {
      setProfiles(prev => prev.filter(p => p.id !== id))
      setDeleteConfirmId(null)
      setDeleteText('')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/profiles?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      setProfiles(prev => prev.filter(p => p.id !== id))
      toast.success('User deleted permanently')
      setDeleteConfirmId(null)
      setDeleteText('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  async function resendInvite(profile: Profile) {
    if (PREVIEW) { toast.info('Preview mode — invite not sent'); return }
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.full_name, resend: true, userId: profile.id }),
    })
    if (res.ok) toast.success('Invite resent')
    else toast.error('Failed to resend invite')
  }

  const deleteTarget = profiles.find(p => p.id === deleteConfirmId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-[#6B6B6B]">{profiles.length} team members</p>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FA6F5] text-white text-[13px] font-medium rounded-lg hover:bg-[#1890D8] transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Invite member
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E8E8E8]">
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E8]">
            {profiles.map(profile => (
              <tr key={profile.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#EBF6FE] flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-semibold text-[#1FA6F5]">
                        {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-[#0E0E0E]">{profile.full_name}</p>
                    {profile.id === currentUserId && (
                      <span className="text-[11px] text-[#9B9B9B]">(you)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={profile.role}
                    onValueChange={(v) => handleRoleChange(profile.id, v as Role)}
                    disabled={profile.id === currentUserId && profiles.filter(p => p.role === 'admin').length === 1}
                  >
                    <SelectTrigger className="w-36 h-8 text-[13px] border-[#E8E8E8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value} className="text-[13px]">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(profile)}
                    disabled={profile.id === currentUserId}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      profile.active ? 'bg-[#1FA6F5]' : 'bg-[#E8E8E8]',
                      profile.id === currentUserId && 'opacity-40 cursor-not-allowed'
                    )}
                    aria-label={profile.active ? 'Deactivate user' : 'Activate user'}
                  >
                    <span className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm',
                      profile.active ? 'translate-x-4' : 'translate-x-1'
                    )} />
                  </button>
                  <span className="ml-2 text-[12px] text-[#6B6B6B]">
                    {profile.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#F1F1F1] transition-colors"
                      disabled={profile.id === currentUserId}
                    >
                      <MoreHorizontal className="h-4 w-4 text-[#6B6B6B]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => resendInvite(profile)} className="text-[13px] cursor-pointer">
                        Resend invite
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => { setDeleteConfirmId(profile.id); setDeleteText('') }}
                        className="text-[13px] text-[#DC2626] focus:text-[#DC2626] cursor-pointer"
                      >
                        Delete permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">Invite team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Full name</Label>
              <Input
                value={inviteForm.name}
                onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Rory Smith"
                required
                className="text-[14px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Email</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="rory@socialworkspro.com"
                required
                className="text-[14px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm(f => ({ ...f, role: v as Role }))}
              >
                <SelectTrigger className="text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value} className="text-[13px]">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviting}
                className="bg-[#1FA6F5] hover:bg-[#1890D8] text-white text-[13px]"
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => { setDeleteConfirmId(null); setDeleteText('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#DC2626]">Delete user permanently</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-[14px] text-[#0E0E0E]">
              This will permanently delete <strong>{deleteTarget?.full_name}</strong> and all their submission history. This cannot be undone.
            </p>
            <p className="text-[13px] text-[#6B6B6B]">
              To deactivate without losing data, close this dialog and toggle their status instead.
            </p>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Type DELETE to confirm</Label>
              <Input
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="text-[14px] font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeleteConfirmId(null); setDeleteText('') }} className="text-[13px]">
                Cancel
              </Button>
              <Button
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                disabled={deleteText !== 'DELETE' || deleting}
                className="bg-[#DC2626] hover:bg-red-700 text-white text-[13px]"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
