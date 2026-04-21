type ErrorWithMetadata = {
  message?: string
  code?: string
  details?: string
  hint?: string
  status?: number
}

export type DatabaseFailureCategory =
  | "rls_policy"
  | "schema_mismatch"
  | "constraint"
  | "conflict"
  | "not_found"
  | "unknown"

export interface ClassifiedDatabaseError {
  category: DatabaseFailureCategory
  userMessage: string
  logMessage: string
}

function errorText(error: ErrorWithMetadata | null | undefined) {
  return [error?.code, error?.message, error?.details, error?.hint].filter(Boolean).join(" | ").toLowerCase()
}

export function classifySupabaseError(error: ErrorWithMetadata | null | undefined): ClassifiedDatabaseError {
  const text = errorText(error)
  const rawMessage = [error?.message, error?.details, error?.hint].filter(Boolean).join(" | ") || "Unknown Supabase error"

  if (error?.code === "42501" || text.includes("row-level security") || text.includes("permission denied")) {
    return {
      category: "rls_policy",
      userMessage: "You do not have permission to save this profile.",
      logMessage: rawMessage,
    }
  }

  if (
    ["22p02", "42804", "23502", "23514"].includes((error?.code || "").toLowerCase()) ||
    text.includes("column") ||
    text.includes("invalid input syntax") ||
    text.includes("datatype mismatch") ||
    text.includes("violates check constraint") ||
    text.includes("null value")
  ) {
    return {
      category: "schema_mismatch",
      userMessage: "The profile data did not match the database schema.",
      logMessage: rawMessage,
    }
  }

  if (error?.code === "23505" || text.includes("duplicate key")) {
    return {
      category: "conflict",
      userMessage: "An account or profile with this information already exists.",
      logMessage: rawMessage,
    }
  }

  if (error?.code === "23503" || text.includes("foreign key")) {
    return {
      category: "constraint",
      userMessage: "The profile could not be linked to your account.",
      logMessage: rawMessage,
    }
  }

  if (error?.code === "PGRST116" || text.includes("no rows")) {
    return {
      category: "not_found",
      userMessage: "The requested profile record could not be found.",
      logMessage: rawMessage,
    }
  }

  return {
    category: "unknown",
    userMessage: "The profile could not be saved due to an unexpected database error.",
    logMessage: rawMessage,
  }
}
