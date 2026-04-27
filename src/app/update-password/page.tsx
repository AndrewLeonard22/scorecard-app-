import { UpdatePasswordForm } from './UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[18px] font-semibold text-[#0E0E0E] tracking-tight">
              SocialWorks
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#1FA6F5] mt-0.5" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E8] rounded-xl shadow-sm p-8">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
