// Import global CSS styles that apply to the entire application
import './globals.css'   

// Metadata for the application - this appears in browser tab and search engines
export const metadata = {
  title: 'TrustShare - Secure File Storage',  // Updated for TrustShare project
  description: 'Secure cloud-based file storage with AES-GCM encryption and blockchain logging',
}

/**
 * RootLayout Component
 * 
 * This is the main layout wrapper for the entire Next.js application.
 * Every page in the app will be wrapped with this layout.
 * 
 * Features:
 * - Provides the basic HTML structure (html, body tags)
 * - Sets up global styles
 * - Contains all child components/pages
 * 
 * @param children - React components that will be rendered inside this layout
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* All page content will be rendered here */}
        {children}
      </body>
    </html>
  )
}