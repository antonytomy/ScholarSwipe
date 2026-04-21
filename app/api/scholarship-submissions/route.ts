import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { supabaseAdmin } from "@/lib/supabase"
import {
  scholarshipSubmissionSchema,
  toScholarshipSubmissionInsert,
} from "@/lib/scholarship-submission"

type RateLimitEntry = {
  count: number
  resetAt: number
}

const submissionRateLimit = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60
const RATE_LIMIT_MAX_REQUESTS = 5

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  return request.headers.get("x-real-ip") || "unknown"
}

function isRateLimited(ip: string) {
  const now = Date.now()
  const current = submissionRateLimit.get(ip)

  if (!current || current.resetAt <= now) {
    submissionRateLimit.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return false
  }

  current.count += 1
  submissionRateLimit.set(ip, current)
  return current.count > RATE_LIMIT_MAX_REQUESTS
}

function formatValidationError(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {}

  for (const issue of error.issues) {
    const field = String(issue.path[0] || "form")
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error("Scholarship submission route missing server-side Supabase admin client")
      return NextResponse.json(
        { error: "Server configuration error. Please try again later." },
        { status: 500 }
      )
    }

    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: "Too many submissions from this connection. Please try again later.",
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = scholarshipSubmissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please correct the highlighted fields and try again.",
          fieldErrors: formatValidationError(parsed.error),
        },
        { status: 400 }
      )
    }

    if (parsed.data.company_website) {
      console.warn("Scholarship submission honeypot triggered", { ip })
      return NextResponse.json({
        success: true,
        message:
          "Thanks for submitting your scholarship. Our team will review it before publishing.",
      })
    }

    const insertPayload = {
      ...toScholarshipSubmissionInsert(parsed.data),
      status: "pending" as const,
      submitter_ip: ip === "unknown" ? null : ip,
      submitter_user_agent: request.headers.get("user-agent"),
    }

    const { error } = await supabaseAdmin
      .from("scholarship_submissions")
      .insert(insertPayload)

    if (error) {
      console.error("Failed to save scholarship submission:", error)
      return NextResponse.json(
        {
          error: "We couldn't save your scholarship submission right now. Please try again.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        "Thanks for submitting your scholarship. Our team will review it before publishing.",
    })
  } catch (error) {
    console.error("Unexpected scholarship submission error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
