// This directive tells Next.js this is a client-side component (uses hooks, events, etc.)
"use client"

// React hooks for state management
import { useState } from "react"
// HTTP client for API calls to backend
import axios from "axios"
// Animation library for smooth UI transitions
import { motion, AnimatePresence } from "framer-motion"
// Icon components from Lucide React (clean, modern icons)
import { Upload, FileText, Search, CheckCircle2, AlertCircle, Copy, Shield } from "lucide-react"
// Custom UI components (likely from shadcn/ui library)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

/**
 * TrustShare Frontend Main Component
 * 
 * This is the main application interface that provides:
 * 1. File Upload with User ID
 * 2. Blockchain Transaction Recording
 * 3. File Metadata Retrieval
 * 4. Professional UI with animations and error handling
 * 
 * Features:
 * - Secure file upload to backend API
 * - Real-time feedback with loading states
 * - Copy-to-clipboard functionality
 * - Responsive design with Tailwind CSS
 * - Smooth animations with Framer Motion
 */
export default function TrustShareApp() {
  // ========================================
  // STATE MANAGEMENT (React Hooks)
  // ========================================
  
  // User identification for file uploads
  const [userId, setUserId] = useState("")
  
  // Selected file object from file input
  const [file, setFile] = useState<File | null>(null)
  
  // Response data from successful file upload (contains file_id and tx_hash)
  const [uploadResult, setUploadResult] = useState<any>(null)
  
  // File ID input for metadata retrieval
  const [fileId, setFileId] = useState("")
  
  // Retrieved metadata object from backend
  const [metadata, setMetadata] = useState<any>(null)
  
  // Separate loading states for upload, metadata retrieval, access request, approvals, download, and records
  const [uploadLoading, setUploadLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(false)
  const [accessLoading, setAccessLoading] = useState(false)
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [recordsLoading, setRecordsLoading] = useState(false)
  
  // Error messages to display to user
  const [error, setError] = useState("")
  
  // Success messages to display to user
  const [success, setSuccess] = useState("")

  // Access Requests & Approvals
  const [accessFileId, setAccessFileId] = useState("");
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [downloadFileId, setDownloadFileId] = useState("");
  const [downloadResult, setDownloadResult] = useState<any>(null);
  const [recordsFileId, setRecordsFileId] = useState("");
  const [records, setRecords] = useState<any>(null);

  // Backend API base URL - connects to your FastAPI server
  const API_BASE = "http://localhost:8000"

  // ========================================
  // FILE UPLOAD HANDLER
  // ========================================
  const handleUpload = async () => {
    if (!file || !userId) {
      setError("Please enter a User ID and select a file before uploading.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploadLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`${API_BASE}/api/file/upload`, formData, {
        headers: {
          'User-ID': userId,
        },
      });
      setUploadResult(res.data);
      setSuccess("File uploaded and recorded on blockchain successfully!");
    } catch (err: any) {
      console.error("Upload error:", err.response?.data);
      let errorMessage = "Upload failed";
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((e: any) => e.msg || e.message || 'Validation error').join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setUploadLoading(false);
    }
  }  

  // ========================================
  // METADATA RETRIEVAL HANDLER (by file name, returns up to 5 latest)
  // ========================================
  const handleGetMeta = async () => {
    if (!fileId) {
      setError("Please enter a File Name first.");
      return;
    }
    setMetaLoading(true);
    setError("");
    setMetadata(null);
    try {
      const res = await axios.get(`${API_BASE}/api/file/meta-by-name`, {
        params: { file_name: fileId }
      });
      setMetadata(res.data);
      setSuccess("Metadata retrieved successfully!");
    } catch (err: any) {
      console.error("Metadata error:", err.response?.data);
      let errorMessage = "Metadata not found";
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((e: any) => e.msg || e.message || 'Error').join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setMetaLoading(false);
    }
  }

  // ========================================
  // UTILITY FUNCTION: Copy to Clipboard
  // ========================================
  const copyToClipboard = (text: string) => {
    // Use modern Clipboard API to copy text
    navigator.clipboard.writeText(text)
    setSuccess("Copied to clipboard!")

    // Auto-clear success message after 2 seconds
    setTimeout(() => setSuccess(""), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">TrustShare</h1>
          <p className="text-slate-600 text-lg">Secure file upload with blockchain verification</p>
        </div>

        {/* Alert Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <Card className="mb-6 shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload File
            </CardTitle>
            <CardDescription>Upload your file securely with blockchain verification</CardDescription>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Select File</label>
              <div className="relative">
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="h-11 cursor-pointer"
                />
                {file && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-slate-400">({(file.size / 1024).toFixed(2)} KB)</span>
                  </motion.div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploadLoading || !file || !userId}
              className="flex items-center justify-center w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium shadow-lg"
            >
              {uploadLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>

            {/* Upload Result */}
            <AnimatePresence>
              {uploadResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-4"
                >
                  <Separator />
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-900 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Upload Successful
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">File ID</p>
                          <p className="text-sm font-mono text-slate-900 break-all">{uploadResult.file_id}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(uploadResult.file_id)}
                          className="ml-2"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Transaction Hash</p>
                          <p className="text-sm font-mono text-slate-900 break-all">{uploadResult.tx_hash}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(uploadResult.tx_hash)}
                          className="ml-2"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Metadata Retrieval Section */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-600" />
              Retrieve Metadata
            </CardTitle>
            <CardDescription>Look up file information using the File ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">File Name</label>
              <Input
                type="text"
                placeholder="Enter file name to retrieve metadata"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              onClick={handleGetMeta}
              disabled={metaLoading || !fileId}
              variant="outline"
              style={{ color: 'rgb(55,99,225)' }}
              className="flex items-center justify-center w-full h-11 border-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50 font-medium bg-transparent"
            >
              {metaLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Get Metadata
                </>
              )}
            </Button>

            {/* Metadata Display */}
            <AnimatePresence>
              {metadata && metadata.files && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-4"
                >
                  <Separator />
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                      <FileText className="w-5 h-5 text-cyan-600" />
                      File Metadata (up to 5 latest)
                    </div>
                    <div className="bg-white rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      {metadata.files.length === 0 ? (
                        <div className="text-slate-500">No files found with that name.</div>
                      ) : (
                        metadata.files.map((meta: any, idx: number) => (
                          <div key={meta.file_id || idx} className="mb-4 border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                            <div><span className="font-semibold">File ID:</span> {meta.file_id}</div>
                            <div><span className="font-semibold">User ID:</span> {meta.user_id}</div>
                            <div><span className="font-semibold">File Name:</span> {meta.file_name}</div>
                            <div><span className="font-semibold">Timestamp:</span> {meta.timestamp ? new Date(meta.timestamp * 1000).toLocaleString() : "-"}</div>
                            {/* Display other metadata fields if needed */}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Access Request Section */}
        <Card className="mt-6 shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Access Request
            </CardTitle>
            <CardDescription>Request access to a specific file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Enter File ID to request access"
              value={accessFileId}
              onChange={(e) => setAccessFileId(e.target.value)}
              className="h-11"
            />
            <Button
              onClick={async () => {
                if (!accessFileId) return setError("Please enter a File ID.");
                setAccessLoading(true); setError(""); setSuccess("");
                try {
                  const res = await axios.post(`${API_BASE}/api/access/request`, { file_id: accessFileId });
                  setSuccess("Access request sent successfully!");
                } catch (err: any) {
                  setError(err.response?.data?.detail || "Failed to send access request.");
                } finally { setAccessLoading(false); }
              }}
              disabled={accessLoading || !accessFileId}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg flex items-center justify-center"
            >
              {accessLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Requesting...
                </>
              ) : (
                <>Request Access</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Approvals Dashboard Section */}
        <Card className="mt-6 shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Approvals Dashboard
            </CardTitle>
            <CardDescription>Approve pending access requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={async () => {
                setApprovalsLoading(true); setError(""); setSuccess("");
                try {
                  const res = await axios.get(`${API_BASE}/api/access/pending`);
                  setApprovalRequests(res.data.requests || []);
                  setSuccess("Pending requests loaded!");
                } catch (err: any) {
                  setError("Failed to load pending requests.");
                } finally { setApprovalsLoading(false); }
              }}
              disabled={approvalsLoading}
              className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium shadow-lg flex items-center justify-center"
            >
              {approvalsLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Loading...
                </>
              ) : (
                <>Load Pending Requests</>
              )}
            </Button>

            {approvalRequests.map((req) => (
              <div key={req.request_id} className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">File ID: {req.file_id}</p>
                  <p className="text-sm text-slate-500">Requester: {req.requester}</p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await axios.post(`${API_BASE}/api/access/approve`, { file_id: req.file_id, requester: req.requester });
                      setSuccess(`Approved access for ${req.requester}`);
                    } catch {
                      setError("Approval failed.");
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Approve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Download & Verification Section */}
        <Card className="mt-6 shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Download & Verify
            </CardTitle>
            <CardDescription>Download decrypted file and verify signature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Enter File ID to download"
              value={downloadFileId}
              onChange={(e) => setDownloadFileId(e.target.value)}
              className="h-11"
            />
            <Button
              onClick={async () => {
                if (!downloadFileId) return setError("Please enter File ID.");
                setDownloadLoading(true); setError(""); setDownloadResult(null);
                try {
                  const res = await axios.get(`${API_BASE}/api/blockchain/file/${downloadFileId}`);
                  setDownloadResult(res.data);
                  setSuccess("File downloaded and verified!");
                } catch {
                  setError("Failed to download or verify file.");
                } finally { setDownloadLoading(false); }
              }}
              disabled={downloadLoading || !downloadFileId}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg flex items-center justify-center"
            >
              {downloadLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Downloading...
                </>
              ) : (
                <>Download & Verify</>
              )}
            </Button>

            {downloadResult && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 font-mono text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{JSON.stringify(downloadResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Records Section (hidden for this version)
        <Card className="mt-6 shadow-xl border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              Blockchain Records
            </CardTitle>
            <CardDescription>View blockchain transaction records for a file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Enter File ID to view records"
              value={recordsFileId}
              onChange={(e) => setRecordsFileId(e.target.value)}
              className="h-11"
            />
            <Button
              onClick={async () => {
                if (!recordsFileId) return setError("Please enter File ID.");
                setRecordsLoading(true); setError(""); setRecords(null);
                try {
                  const res = await axios.get(`${API_BASE}/api/blockchain/file/${recordsFileId}`);
                  setRecords(res.data);
                  setSuccess("Blockchain records retrieved!");
                } catch {
                  setError("Failed to fetch blockchain records.");
                } finally { setRecordsLoading(false); }
              }}
              disabled={recordsLoading || !recordsFileId}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg flex items-center justify-center"
            >
              {recordsLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  Loading...
                </>
              ) : (
                <>View Records</>
              )}
            </Button>

            {records && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(records, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
        */}

        {/* Footer */}
        <motion.p
          className="text-center text-slate-500 text-sm mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Powered by blockchain technology for secure file verification
        </motion.p>
      </motion.div>
    </div>
  )
}
