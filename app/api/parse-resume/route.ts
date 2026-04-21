import { NextRequest, NextResponse } from "next/server"
import { extractTextFromDocument, parseProfileDocument } from "@/lib/profile-document-parser"

const MAX_SIZE = 10 * 1024 * 1024

function countExtractedFields(data: object) {
  return Object.values(data).filter((value) => {
    if (typeof value === "boolean") return false
    if (Array.isArray(value)) return value.length > 0
    return Boolean(String(value ?? "").trim())
  }).length
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("document") as File | null

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 })
    }

    const lowerName = file.name.toLowerCase()
    const isSupported =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".txt") ||
      file.type === "application/pdf" ||
      file.type === "text/plain"

    if (!isSupported || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Please upload a PDF or TXT resume under 10MB." },
        { status: 400 }
      )
    }

    const text = await extractTextFromDocument(file)
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from that file. Try a text-based PDF or TXT resume." },
        { status: 400 }
      )
    }

    const parsed = parseProfileDocument("resume", text)
    const fieldsExtracted = countExtractedFields(parsed.data)

    return NextResponse.json({
      success: true,
      data: parsed.data,
      review: parsed.review,
      fieldsExtracted,
      totalFields: Object.keys(parsed.data).length,
      message: `Extracted ${fieldsExtracted} profile fields from your resume. Review everything before saving.`,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("Resume parsing error:", error)
    return NextResponse.json(
      { error: `Failed to parse the resume: ${errMsg}. You can still complete the form manually.` },
      { status: 500 }
    )
  }
}
