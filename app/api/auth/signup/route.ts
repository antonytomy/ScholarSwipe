import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateProfilePayload } from '@/lib/profile-payload'
import { classifySupabaseError } from '@/lib/supabase-error-utils'
import {
  USER_PROFILE_TABLE,
  buildUserProfileWritePayload,
  getMissingRequiredSignupColumns,
  resolveSupportedUserProfileColumns,
  validateUserProfileWritePayload,
} from '@/lib/user-profile-schema'
import type { SignupApiResponse, SignupData, SignupFailureStage } from '@/lib/types'

const inFlightSignupAttempts = new Map<string, { requestId: string; attemptId: string; startedAt: number; trigger: string }>()

function createErrorResponse(
  status: number,
  requestId: string,
  stage: SignupFailureStage,
  error: string,
  extras: Partial<SignupApiResponse> = {}
) {
  const response: SignupApiResponse = {
    success: false,
    requestId,
    stage,
    error,
    ...extras,
  }

  return NextResponse.json(response, { status })
}

async function cleanupPartialAuthUser(userId: string, requestId: string) {
  if (!supabaseAdmin) {
    console.error(`[signup:${requestId}] Cleanup skipped: service role client unavailable`)
    return { attempted: false, succeeded: false, error: 'Service role client unavailable for cleanup.' }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) {
    console.error(`[signup:${requestId}] Partial auth cleanup failed:`, error)
    return { attempted: true, succeeded: false, error: error.message }
  }

  console.log(`[signup:${requestId}] Partial auth cleanup succeeded for user ${userId}`)
  return { attempted: true, succeeded: true }
}

function mapProfileFailureStage(category: string): SignupFailureStage {
  if (category === 'rls_policy') return 'rls_policy'
  if (category === 'schema_mismatch') return 'schema_mismatch'
  return 'profile_save'
}

function logProfileMutationError(
  requestId: string,
  operation: string,
  userId: string,
  payload: Record<string, unknown>,
  error: { code?: string; message?: string; details?: string; hint?: string } | null | undefined
) {
  console.error(`[signup:${requestId}] Profile ${operation} failed`, {
    authUserId: userId,
    table: USER_PROFILE_TABLE,
    payload,
    error: {
      code: error?.code ?? null,
      message: error?.message ?? null,
      details: error?.details ?? null,
      hint: error?.hint ?? null,
    },
  })
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  let signupEmailKey: string | null = null

  try {
    if (!supabaseAdmin) {
      return createErrorResponse(
        500,
        requestId,
        'cleanup',
        'Signup is temporarily unavailable because the server is missing service-role access for safe cleanup.'
      )
    }

    const signupData: SignupData = await request.json()
    const signupAttemptId = request.headers.get('x-signup-attempt-id') || `server-${requestId}`
    const signupTrigger = request.headers.get('x-signup-trigger') || 'unknown'
    signupEmailKey = signupData.email.trim().toLowerCase()
    const inFlightAttempt = inFlightSignupAttempts.get(signupEmailKey)

    console.log(`[signup:${requestId}] Signup attempt received`, {
      trigger: signupTrigger,
      attemptId: signupAttemptId,
      email: signupEmailKey,
      inFlightForEmail: inFlightAttempt
        ? {
            requestId: inFlightAttempt.requestId,
            attemptId: inFlightAttempt.attemptId,
            startedAt: inFlightAttempt.startedAt,
            ageMs: Date.now() - inFlightAttempt.startedAt,
            trigger: inFlightAttempt.trigger,
          }
        : null,
    })

    if (inFlightAttempt) {
      console.warn(`[signup:${requestId}] Duplicate overlapping signup blocked`, {
        trigger: signupTrigger,
        attemptId: signupAttemptId,
        email: signupEmailKey,
        existing: inFlightAttempt,
      })
      return createErrorResponse(
        409,
        requestId,
        'auth_signup',
        'A signup attempt for this email is already in progress. Please wait for the current request to finish.'
      )
    }

    inFlightSignupAttempts.set(signupEmailKey, {
      requestId,
      attemptId: signupAttemptId,
      startedAt: Date.now(),
      trigger: signupTrigger,
    })

    const requiredFields = ['email', 'password', 'full_name', 'phone', 'dob', 'gender']
    const missingFields = requiredFields.filter((field) => {
      const val = signupData[field as keyof SignupData]
      return val === undefined || val === null || (typeof val === 'string' && val.trim() === '')
    })

    if (missingFields.length > 0) {
      console.log(`[signup:${requestId}] Missing required fields:`, missingFields)
      return createErrorResponse(
        400,
        requestId,
        'client_validation',
        `Please fill in all required fields: ${missingFields.join(', ')}`
      )
    }

    const { normalized: normalizedProfile, errors: profileErrors } = validateProfilePayload(
      signupData as unknown as Record<string, unknown>,
      { requireCoreFields: true }
    )

    if (profileErrors.length > 0) {
      console.log(`[signup:${requestId}] Signup profile validation errors:`, profileErrors)
      return createErrorResponse(
        400,
        requestId,
        'client_validation',
        `Please fix the onboarding data before creating your account: ${profileErrors.join(', ')}`
      )
    }

    if (signupData.password !== signupData.confirmPassword) {
      return createErrorResponse(400, requestId, 'client_validation', 'Passwords do not match')
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/auth/callback`
    console.log(`[signup:${requestId}] Email redirect URL:`, redirectUrl)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: { full_name: signupData.full_name },
        emailRedirectTo: redirectUrl,
      },
    })

    if (authError) {
      console.error(`[signup:${requestId}] Auth signup failed`, {
        trigger: signupTrigger,
        attemptId: signupAttemptId,
        email: signupEmailKey,
        error: {
          code: authError.code ?? null,
          message: authError.message ?? null,
          status: 'status' in authError ? authError.status : null,
          details: 'details' in authError ? authError.details : null,
          hint: 'hint' in authError ? authError.hint : null,
          name: authError.name ?? null,
        },
      })

      if (authError.message.includes('already registered')) {
        return createErrorResponse(400, requestId, 'auth_signup', 'An account with this email already exists. Please try logging in instead.')
      }
      if (authError.message.includes('Invalid email')) {
        return createErrorResponse(400, requestId, 'auth_signup', 'Please enter a valid email address.')
      }
      if (authError.message.includes('Password')) {
        return createErrorResponse(400, requestId, 'auth_signup', 'Password must be at least 6 characters long.')
      }

      return createErrorResponse(400, requestId, 'auth_signup', authError.message)
    }

    if (!authData.user) {
      return createErrorResponse(500, requestId, 'auth_signup', 'Auth signup completed without returning a user record.')
    }

    const supportedColumns = await resolveSupportedUserProfileColumns(supabaseAdmin)
    const missingRequiredColumns = getMissingRequiredSignupColumns(supportedColumns)
    const { payload: profileData, unsupportedColumns } = buildUserProfileWritePayload(
      authData.user.id,
      normalizedProfile,
      supportedColumns
    )
    const payloadValidationErrors = validateUserProfileWritePayload(profileData, { requireId: true })

    console.log(`[signup:${requestId}] Auth signup succeeded for user ${authData.user.id}. Saving onboarding profile.`)
    console.log(`[signup:${requestId}] Profile preflight`, {
      authUserId: authData.user.id,
      table: USER_PROFILE_TABLE,
      supportedColumns: [...supportedColumns],
      unsupportedColumns,
      missingRequiredColumns,
      payload: profileData,
    })

    if (missingRequiredColumns.length > 0) {
      const cleanup = await cleanupPartialAuthUser(authData.user.id, requestId)
      return createErrorResponse(
        500,
        requestId,
        'schema_mismatch',
        `Account created in Auth but onboarding profile insert was blocked because ${USER_PROFILE_TABLE} is missing required columns: ${missingRequiredColumns.join(', ')}`,
        {
          cleanupAttempted: cleanup.attempted,
          cleanupSucceeded: cleanup.succeeded,
          details: cleanup.error,
        }
      )
    }

    if (payloadValidationErrors.length > 0) {
      console.error(`[signup:${requestId}] Profile payload validation failed`, {
        authUserId: authData.user.id,
        table: USER_PROFILE_TABLE,
        payload: profileData,
        validationErrors: payloadValidationErrors,
      })

      const cleanup = await cleanupPartialAuthUser(authData.user.id, requestId)
      return createErrorResponse(
        400,
        requestId,
        'client_validation',
        `Please fix the onboarding data before creating your account: ${payloadValidationErrors.join(', ')}`,
        {
          cleanupAttempted: cleanup.attempted,
          cleanupSucceeded: cleanup.succeeded,
          details: cleanup.error,
        }
      )
    }

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from(USER_PROFILE_TABLE)
      .select('id')
      .eq('email', signupData.email)
      .maybeSingle()

    if (existingProfileError) {
      const classified = classifySupabaseError(existingProfileError)
      console.error(`[signup:${requestId}] Failed to check for existing profile:`, classified.logMessage, existingProfileError)
      const cleanup = await cleanupPartialAuthUser(authData.user.id, requestId)

      return createErrorResponse(
        500,
        requestId,
        mapProfileFailureStage(classified.category),
        `Account created in Auth but onboarding lookup failed: ${classified.userMessage}`,
        {
          cleanupAttempted: cleanup.attempted,
          cleanupSucceeded: cleanup.succeeded,
          details: cleanup.error,
        }
      )
    }

    const profileOperation = existingProfile ? 'update' : 'insert'
    console.log(
      existingProfile
        ? `[signup:${requestId}] Existing profile found by email. Linking auth user to existing profile row.`
        : `[signup:${requestId}] No existing profile found. Inserting new onboarding profile row.`
    )

    const profileMutation = existingProfile
      ? await supabaseAdmin.from(USER_PROFILE_TABLE).update(profileData).eq('email', signupData.email)
      : await supabaseAdmin.from(USER_PROFILE_TABLE).insert(profileData)

    if (profileMutation.error) {
      const classified = classifySupabaseError(profileMutation.error)
      logProfileMutationError(
        requestId,
        profileOperation,
        authData.user.id,
        profileData,
        profileMutation.error
      )
      console.error(`[signup:${requestId}] Profile ${profileOperation} failed:`, classified.logMessage)
      const cleanup = await cleanupPartialAuthUser(authData.user.id, requestId)

      return createErrorResponse(
        classified.category === 'conflict' ? 400 : 500,
        requestId,
        mapProfileFailureStage(classified.category),
        `Account created in Auth but onboarding profile ${profileOperation} failed: ${classified.userMessage}`,
        {
          cleanupAttempted: cleanup.attempted,
          cleanupSucceeded: cleanup.succeeded,
          details: cleanup.error,
        }
      )
    }

    console.log(`[signup:${requestId}] Skipping generate-matches bootstrap during beta; hard filter runs at read time.`)

    return NextResponse.json({
      success: true,
      requestId,
      message: 'User created successfully',
      user: authData.user,
    })
  } catch (error) {
    console.error(`[signup:${requestId}] Unexpected signup error:`, error)
    return createErrorResponse(500, requestId, 'unknown', 'Something went wrong during signup. Please try again.')
  } finally {
    if (signupEmailKey) {
      const activeAttempt = inFlightSignupAttempts.get(signupEmailKey)
      if (activeAttempt?.requestId === requestId) {
        inFlightSignupAttempts.delete(signupEmailKey)
      }
    }
  }
}
