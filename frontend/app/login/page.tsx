"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        username,
        password,
      })

      // Backend returns { access_token, token_type }
      const token = res.data.access_token || res.data.token
      if (!token) {
        setError("Login succeeded but no token was returned.")
        return
      }
      localStorage.setItem("jwt", token)
      setSuccess("Login successful!")
      setTimeout(() => {
        router.push("/")
      }, 800)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (!err.response) {
        setError("Cannot reach backend at " + API_BASE + ". Is it running on port 8000?")
      } else {
        setError(detail || "Login failed. Please check your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/25 text-white">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TrustShare</h1>
          <p className="text-slate-600">Secure login to access your files</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="destructive" className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {success && (
          <div className="mb-4">
            <Alert className="flex items-start gap-2 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your username and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin()
              }}
              className="h-11"
            />
            <p className="text-xs text-slate-400">Demo: alice / 1234</p>
            <Button
              onClick={handleLogin}
              disabled={loading || !username || !password}
              className="w-full h-11"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
