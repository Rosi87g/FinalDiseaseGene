import { NextResponse } from 'next/server'

// Reads a server-only env var (no NEXT_PUBLIC_ prefix), so this value
// never ships inside the client JS bundle or appears in page source.
// Set it in .env.local:
//   APK_DOWNLOAD_URL=https://github.com/<your-username>/<your-repo>/releases/download/v1.0.0/diseasegenemap-v1.0.0.apk

export async function GET() {
  const apkUrl = process.env.APK_DOWNLOAD_URL

  if (!apkUrl) {
    return NextResponse.json(
      { error: 'APK_DOWNLOAD_URL is not set in the environment.' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(apkUrl)
}
