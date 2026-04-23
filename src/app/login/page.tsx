import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">SocialWorks</h1>
          <p className="text-muted-foreground mt-1 text-sm">Team Scorecard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
