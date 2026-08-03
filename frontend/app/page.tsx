"use client"

import { useCallback, useRef, useState } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Shield,
  KeyRound,
  Download,
  ArrowRight,
  X,
  ExternalLink,
  Lock,
  PenLine,
  Database,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type TabId = "upload" | "lookup" | "access" | "verify"

const TABS: { id: TabId; label: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "lookup", label: "Lookup", icon: Search },
  { id: "access", label: "Access", icon: KeyRound },
  { id: "verify", label: "Verify", icon: Shield },
]

const FLOW_STEPS = [
  { id: "upload", label: "Upload & encrypt" },
  { id: "access", label: "Request access" },
  { id: "approve", label: "Approve" },
  { id: "verify", label: "Download & verify" },
] as const

const UPLOAD_PIPELINE = [
  { id: "encrypt", label: "Encrypt", detail: "AES-256-GCM", icon: Lock },
  { id: "sign", label: "Sign", detail: "ECDSA", icon: PenLine },
  { id: "store", label: "Store", detail: "Encrypted blob", icon: Database },
  { id: "log", label: "Log", detail: "Sepolia chain", icon: Link2 },
] as const

const SEPOLIA_TX = "https://sepolia.etherscan.io/tx/"

function etherscanTxUrl(hash: string) {
  const clean = hash.startsWith("0x") ? hash : `0x${hash}`
  return `${SEPOLIA_TX}${clean}`
}

function extractError(err: any, fallback: string): string {
  const data = err?.response?.data
  if (!data) return err?.message || fallback
  if (typeof data.detail === "string") return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map((e: any) => e.msg || e.message || "Validation error").join(", ")
  }
  if (data.message) return data.message
  if (typeof data === "string") return data
  return fallback
}

function ResultRow({
  label,
  value,
  onCopy,
  href,
}: {
  label: string
  value: string
  onCopy?: () => void
  href?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-mono text-slate-900 break-all">{value}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl p-2 text-blue-600 hover:bg-blue-50"
            title="Open on Etherscan"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {onCopy && (
          <Button variant="ghost" size="sm" onClick={onCopy} className="shrink-0" type="button">
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function PipelineSteps({
  activeIndex,
  complete,
}: {
  activeIndex: number
  complete: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        Security pipeline
      </p>
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {UPLOAD_PIPELINE.map((step, i) => {
          const Icon = step.icon
          const done = complete || i < activeIndex
          const current = !complete && i === activeIndex
          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-colors",
                done
                  ? "border-green-200 bg-green-50"
                  : current
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white"
              )}
            >
              <div
                className={cn(
                  "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg",
                  done
                    ? "bg-green-600 text-white"
                    : current
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <p
                className={cn(
                  "text-xs font-semibold",
                  done ? "text-green-800" : current ? "text-blue-800" : "text-slate-500"
                )}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{step.detail}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StatusBadge({
  ok,
  label,
}: {
  ok: boolean
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
        ok
          ? "bg-green-50 text-green-800 border-green-200"
          : "bg-slate-100 text-slate-500 border-slate-200"
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  )
}

function FileDropZone({
  file,
  onFile,
}: {
  file: File | null
  onFile: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = useCallback(
    (list: FileList | null) => {
      onFile(list?.[0] || null)
    },
    [onFile]
  )

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">File</label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pick(e.dataTransfer.files)
        }}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all",
          dragging
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
        <div
          className={cn(
            "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl",
            dragging ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm border border-slate-200"
          )}
        >
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-blue-700">Drop a file</span> or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-400">Encrypted before storage</p>
      </div>

      {file && (
        <div className="flex items-center gap-2 text-sm bg-white p-3 rounded-xl border border-slate-200">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-medium truncate text-slate-800">{file.name}</span>
          <span className="text-slate-400 shrink-0 text-xs">
            {(file.size / 1024).toFixed(2)} KB
          </span>
          <button
            type="button"
            aria-label="Remove file"
            className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            onClick={(e) => {
              e.stopPropagation()
              onFile(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function TrustShareApp() {
  const [activeTab, setActiveTab] = useState<TabId>("upload")

  const [userId, setUserId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const [fileId, setFileId] = useState("")
  const [metadata, setMetadata] = useState<any>(null)

  const [accessFileId, setAccessFileId] = useState("")
  const [approvalRequests, setApprovalRequests] = useState<any[]>([])

  const [downloadFileId, setDownloadFileId] = useState("")
  const [downloadResult, setDownloadResult] = useState<any>(null)

  const [uploadLoading, setUploadLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(false)
  const [accessLoading, setAccessLoading] = useState(false)
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [pipelineIndex, setPipelineIndex] = useState(0)
  const [pipelineComplete, setPipelineComplete] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const clearAlerts = () => {
    setError("")
    setSuccess("")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("Copied to clipboard!")
    setTimeout(() => setSuccess(""), 2000)
  }

  const goToTab = (tab: TabId) => {
    clearAlerts()
    setActiveTab(tab)
  }

  const handleUpload = async () => {
    if (!file || !userId) {
      setError("Please enter a User ID and select a file before uploading.")
      return
    }
    const formData = new FormData()
    formData.append("file", file)
    setUploadLoading(true)
    setUploadResult(null)
    setPipelineComplete(false)
    setPipelineIndex(0)
    clearAlerts()

    // Visual progress while the backend runs encrypt → sign → store → log
    const timers = [0, 1, 2].map((i) =>
      window.setTimeout(() => setPipelineIndex(i + 1), 450 * (i + 1))
    )

    try {
      const res = await axios.post(`${API_BASE}/api/file/upload`, formData, {
        headers: { "User-ID": userId },
      })
      timers.forEach(clearTimeout)
      setPipelineIndex(UPLOAD_PIPELINE.length - 1)
      setPipelineComplete(true)
      setUploadResult(res.data)
      setSuccess("File uploaded and recorded on blockchain successfully!")
      if (res.data?.file_id) {
        setAccessFileId(res.data.file_id)
        setDownloadFileId(res.data.file_id)
      }
    } catch (err: any) {
      timers.forEach(clearTimeout)
      setPipelineComplete(false)
      setError(extractError(err, "Upload failed"))
    } finally {
      setUploadLoading(false)
    }
  }

  const handleGetMeta = async () => {
    if (!fileId) {
      setError("Please enter a File Name first.")
      return
    }
    setMetaLoading(true)
    clearAlerts()
    setMetadata(null)
    try {
      const res = await axios.get(`${API_BASE}/api/file/meta-by-name`, {
        params: { file_name: fileId },
      })
      setMetadata(res.data)
      setSuccess("Metadata retrieved successfully!")
    } catch (err: any) {
      setError(extractError(err, "Metadata not found"))
    } finally {
      setMetaLoading(false)
    }
  }

  const flowActiveIndex =
    activeTab === "upload" || activeTab === "lookup"
      ? 0
      : activeTab === "access"
        ? 1
        : 3

  return (
    <div className="min-h-screen bg-app">
      {/* Compact top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/25">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">TrustShare</span>
          </div>
          <a
            href="/login"
            className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            Login
          </a>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Secure file sharing
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-xl sm:mx-0 mx-auto">
            Encrypt, share, and verify with blockchain-backed integrity.
          </p>
        </div>

        {/* Flow */}
        <div className="mb-6 rounded-2xl bg-white/80 border border-slate-200 shadow-sm px-3 py-4 sm:px-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3 text-center">
            How it works
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                    i === flowActiveIndex
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm"
                      : i < flowActiveIndex
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-500"
                  )}
                >
                  <span className="font-mono text-[10px] opacity-80">{i + 1}</span>
                  {step.label}
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="hidden h-3.5 w-3.5 text-slate-300 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="alert-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4"
            >
              <Alert variant="destructive" className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          ) : success ? (
            <motion.div
              key="alert-success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4"
            >
              <Alert className="flex items-start gap-2 border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="TrustShare actions"
          className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => goToTab(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                activeTab === id
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "upload" && (
          <div key="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload File
                </CardTitle>
                <CardDescription>
                  Encrypt the file, store it, and log the event on Sepolia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">User ID</label>
                  <Input
                    type="text"
                    placeholder="Enter your user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="h-11"
                  />
                </div>

                <FileDropZone file={file} onFile={setFile} />

                {(uploadLoading || pipelineComplete || uploadResult) && (
                  <PipelineSteps
                    activeIndex={pipelineIndex}
                    complete={pipelineComplete}
                  />
                )}

                <Button
                  onClick={handleUpload}
                  disabled={uploadLoading || !file || !userId}
                  className="w-full h-11"
                >
                  {uploadLoading ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>

                <AnimatePresence>
                  {uploadResult && (
                    <motion.div
                      key="upload-result"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-2 overflow-hidden"
                    >
                      <Separator />
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-green-900 font-semibold">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          Upload successful
                          <StatusBadge ok label="On-chain logged" />
                        </div>
                        {uploadResult.file_id && (
                          <ResultRow
                            label="File ID"
                            value={uploadResult.file_id}
                            onCopy={() => copyToClipboard(uploadResult.file_id)}
                          />
                        )}
                        {uploadResult.tx_hash && (
                          <ResultRow
                            label="Transaction Hash"
                            value={uploadResult.tx_hash}
                            onCopy={() => copyToClipboard(uploadResult.tx_hash)}
                            href={etherscanTxUrl(uploadResult.tx_hash)}
                          />
                        )}
                        {uploadResult.tx_hash && (
                          <a
                            href={etherscanTxUrl(uploadResult.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            View on Sepolia Etherscan
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Button variant="outline" className="w-full" onClick={() => goToTab("access")}>
                          Next: Request access
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "lookup" && (
          <div key="lookup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-600" />
                  Lookup Metadata
                </CardTitle>
                <CardDescription>Find recent files by name (up to 5 latest)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">File Name</label>
                  <Input
                    type="text"
                    placeholder="Enter file name"
                    value={fileId}
                    onChange={(e) => setFileId(e.target.value)}
                    className="h-11"
                  />
                </div>

                <Button
                  onClick={handleGetMeta}
                  disabled={metaLoading || !fileId}
                  variant="outline"
                  className="w-full h-11"
                >
                  {metaLoading ? "Fetching..." : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Get Metadata
                    </>
                  )}
                </Button>

                <AnimatePresence>
                  {metadata?.files && (
                    <motion.div
                      key="lookup-result"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-2 overflow-hidden"
                    >
                      <Separator />
                      {metadata.files.length === 0 ? (
                        <p className="text-sm text-slate-500">No files found with that name.</p>
                      ) : (
                        metadata.files.map((meta: any, idx: number) => (
                          <div
                            key={`${meta.file_id || "file"}-${idx}`}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"
                          >
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                              <FileText className="w-4 h-4 text-cyan-600" />
                              {meta.file_name || "Untitled"}
                            </div>
                            {meta.file_id && (
                              <ResultRow
                                label="File ID"
                                value={meta.file_id}
                                onCopy={() => copyToClipboard(meta.file_id)}
                              />
                            )}
                            {meta.user_id && (
                              <ResultRow label="Owner" value={String(meta.user_id)} />
                            )}
                            <ResultRow
                              label="Timestamp"
                              value={
                                meta.timestamp
                                  ? new Date(meta.timestamp * 1000).toLocaleString()
                                  : "—"
                              }
                            />
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAccessFileId(meta.file_id)
                                  goToTab("access")
                                }}
                              >
                                Request access
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDownloadFileId(meta.file_id)
                                  goToTab("verify")
                                }}
                              >
                                Verify
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "access" && (
          <div key="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  Request Access
                </CardTitle>
                <CardDescription>Ask the owner for permission to open a file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter File ID"
                  value={accessFileId}
                  onChange={(e) => setAccessFileId(e.target.value)}
                  className="h-11"
                />
                <Button
                  onClick={async () => {
                    if (!accessFileId) return setError("Please enter a File ID.")
                    setAccessLoading(true)
                    clearAlerts()
                    try {
                      await axios.post(`${API_BASE}/api/access/request`, {
                        file_id: accessFileId,
                      })
                      setSuccess("Access request sent successfully!")
                    } catch (err: any) {
                      setError(extractError(err, "Failed to send access request."))
                    } finally {
                      setAccessLoading(false)
                    }
                  }}
                  disabled={accessLoading || !accessFileId}
                  className="w-full h-11"
                >
                  {accessLoading ? "Requesting..." : "Request Access"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Approvals
                </CardTitle>
                <CardDescription>Review and approve pending access requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={async () => {
                    setApprovalsLoading(true)
                    clearAlerts()
                    try {
                      const res = await axios.get(`${API_BASE}/api/access/pending`)
                      setApprovalRequests(res.data.requests || [])
                      setSuccess("Pending requests loaded!")
                    } catch {
                      setError("Failed to load pending requests.")
                    } finally {
                      setApprovalsLoading(false)
                    }
                  }}
                  disabled={approvalsLoading}
                  className="w-full h-11 !from-emerald-600 !to-green-600 hover:!from-emerald-700 hover:!to-green-700"
                >
                  {approvalsLoading ? "Loading..." : "Load Pending Requests"}
                </Button>

                {approvalRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No pending requests loaded yet.
                  </p>
                ) : (
                  approvalRequests.map((req, idx) => (
                    <div
                      key={req.request_id || `${req.file_id}-${req.requester}-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-slate-800 break-all">
                          File ID: {req.file_id}
                        </p>
                        <p className="text-sm text-slate-500 break-all">
                          Requester: {req.requester}
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            await axios.post(`${API_BASE}/api/access/approve`, {
                              file_id: req.file_id,
                              requester: req.requester,
                            })
                            setSuccess(`Approved access for ${req.requester}`)
                            setDownloadFileId(req.file_id)
                          } catch {
                            setError("Approval failed.")
                          }
                        }}
                        className="shrink-0 !from-emerald-500 !to-green-600"
                      >
                        Approve
                      </Button>
                    </div>
                  ))
                )}

                <Button variant="outline" className="w-full" onClick={() => goToTab("verify")}>
                  Next: Download &amp; verify
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "verify" && (
          <div key="verify">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  Download &amp; Verify
                </CardTitle>
                <CardDescription>
                  Fetch blockchain record and confirm integrity signals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter File ID"
                  value={downloadFileId}
                  onChange={(e) => setDownloadFileId(e.target.value)}
                  className="h-11"
                />
                <Button
                  onClick={async () => {
                    if (!downloadFileId) return setError("Please enter File ID.")
                    setDownloadLoading(true)
                    clearAlerts()
                    setDownloadResult(null)
                    try {
                      const res = await axios.get(
                        `${API_BASE}/api/blockchain/file/${downloadFileId}`
                      )
                      setDownloadResult(res.data)
                      setSuccess("File record retrieved and ready to review!")
                    } catch {
                      setError("Failed to download or verify file.")
                    } finally {
                      setDownloadLoading(false)
                    }
                  }}
                  disabled={downloadLoading || !downloadFileId}
                  className="w-full h-11"
                >
                  {downloadLoading ? "Verifying..." : "Download & Verify"}
                </Button>

                {downloadResult && (() => {
                  const fileHash = downloadResult.file_hash || downloadResult.hash
                  const signature = downloadResult.signature || downloadResult.sig
                  const txHash =
                    downloadResult.tx_hash || downloadResult.transaction_hash
                  const hasHash = Boolean(fileHash)
                  const hasSig = Boolean(signature)
                  const hasTx = Boolean(txHash)
                  const verified = hasHash || hasSig || hasTx

                  return (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 font-semibold text-blue-950">
                          <Shield className="w-5 h-5 text-blue-600" />
                          Verification summary
                        </div>
                        {verified && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge ok={hasHash} label="Hash recorded" />
                        <StatusBadge ok={hasSig} label="Signature present" />
                        <StatusBadge ok={hasTx} label="On-chain log" />
                      </div>

                      {downloadResult.file_id && (
                        <ResultRow label="File ID" value={String(downloadResult.file_id)} />
                      )}
                      {hasHash && (
                        <ResultRow
                          label="File Hash"
                          value={String(fileHash)}
                          onCopy={() => copyToClipboard(String(fileHash))}
                        />
                      )}
                      {hasSig && (
                        <ResultRow
                          label="Signature"
                          value={String(signature)}
                          onCopy={() => copyToClipboard(String(signature))}
                        />
                      )}
                      {hasTx && (
                        <>
                          <ResultRow
                            label="Transaction Hash"
                            value={String(txHash)}
                            onCopy={() => copyToClipboard(String(txHash))}
                            href={etherscanTxUrl(String(txHash))}
                          />
                          <a
                            href={etherscanTxUrl(String(txHash))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors bg-white"
                          >
                            View on Sepolia Etherscan
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      {(downloadResult.owner || downloadResult.user_id) && (
                        <ResultRow
                          label="Owner"
                          value={String(downloadResult.owner || downloadResult.user_id)}
                        />
                      )}
                      {!hasHash && !hasSig && !hasTx && (
                        <div className="space-y-2">
                          {Object.entries(downloadResult)
                            .filter(([key]) => key)
                            .map(([key, value]) => (
                            <ResultRow
                              key={key}
                              label={key}
                              value={
                                typeof value === "string"
                                  ? value
                                  : JSON.stringify(value, null, 2)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-slate-400">
          AES-GCM · ECDSA · Sepolia
        </p>
      </div>
    </div>
  )
}
