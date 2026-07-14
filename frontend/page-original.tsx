"use client"

import { useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"

/**
 * Frontend UI for the TrustShare Backend
 * --------------------------------------
 * This React component provides:
 *  - File upload with encryption & blockchain recording
 *  - Metadata retrieval by file ID
 *  - Visual feedback for status and responses
 *
 * It interacts directly with the FastAPI backend (app.py),
 * calling its REST endpoints via Axios.
 */
export default function App() {
  // -------------------------------
  // React State Management
  // -------------------------------
  // The user ID sent in request header
  const [userId, setUserId] = useState("")

  // File chosen by user
  const [file, setFile] = useState(null)

  // Upload result (contains file_id and tx_hash)
  const [uploadResult, setUploadResult] = useState(null)

  // File ID entered for metadata lookup
  const [fileId, setFileId] = useState("")

  // Retrieved metadata from backend
  const [metadata, setMetadata] = useState(null)

  // Loading state to show progress
  const [loading, setLoading] = useState(false)

  // Backend API base URL (adjust this to your FastAPI server address)
  const API_BASE = "http://localhost:8000"

  // ---------------------------------------------------------------
  // Function: handleUpload
  // ---------------------------------------------------------------
  // Triggered when user clicks the "Upload" button.
  // It sends a multipart/form-data POST request to /api/file/upload.
  const handleUpload = async () => {
    if (!file || !userId) {
      alert("Please enter a User ID and select a file before uploading.")
      return
    }

    // Create a FormData object (used for file uploads)
    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    try {
      // Send request to FastAPI backend
      const res = await axios.post(`${API_BASE}/api/file/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          user_id: userId, // custom header required by backend
        },
      })

      // Store response (contains file_id and tx_hash)
      setUploadResult(res.data)
    } catch (err) {
      // Display backend error or network issue
      alert("Upload failed: " + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------
  // Function: handleGetMeta
  // ---------------------------------------------------------------
  // Triggered when user clicks "Get Metadata".
  // It sends a GET request to /api/file/meta/{file_id}.
  const handleGetMeta = async () => {
    if (!fileId) {
      alert("Please enter a File ID first.")
      return
    }

    setLoading(true)
    try {
      // Fetch metadata JSON from backend
      const res = await axios.get(`${API_BASE}/api/file/meta/${fileId}`)
      setMetadata(res.data)
    } catch (err) {
      alert("Metadata not found: " + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------
  // Component UI
  // ---------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Animated card container using Framer Motion */}
      <motion.div
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-center mb-4 text-indigo-600">TrustShare File Upload</h1>

        {/* -------------------------------
            File Upload Section
           ------------------------------- */}
        <div className="space-y-3">
          {/* Input field for User ID */}
          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          {/* File input for selecting the file */}
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full border rounded-lg p-2" />

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        {/* -------------------------------
            Display Upload Result
           ------------------------------- */}
        {uploadResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
            <p>
              <strong>File ID:</strong> {uploadResult.file_id}
            </p>
            <p>
              <strong>Tx Hash:</strong> {uploadResult.tx_hash}
            </p>
          </div>
        )}

        <hr className="my-4" />

        {/* -------------------------------
            Metadata Retrieval Section
           ------------------------------- */}
        <div className="space-y-3">
          {/* Input field for file ID */}
          <input
            type="text"
            placeholder="Enter File ID to get metadata"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          {/* Button to fetch metadata */}
          <button
            onClick={handleGetMeta}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            {loading ? "Fetching..." : "Get Metadata"}
          </button>
        </div>

        {/* -------------------------------
            Display Metadata
           ------------------------------- */}
        {metadata && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
            {/* Pretty-print JSON metadata */}
            <pre className="whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>
          </div>
        )}
      </motion.div>
    </div>
  )
}
