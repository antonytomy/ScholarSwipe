"use client"

import { BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  formatGpaTierLabel,
  getExactGpaValidationMessage,
  GPA_RANGE_OPTIONS,
  GPA_SCALE_OPTIONS,
  getGpaScaleMax,
  normalizeGpaToFourPoint,
  type GpaMode,
  type GpaScale,
} from "@/lib/profile-form-options"

type GpaProfileFieldProps = {
  mode: GpaMode
  exactValue: string | number | null | undefined
  rangeValue: string | null | undefined
  scaleValue: GpaScale
  onModeChange: (mode: GpaMode) => void
  onExactChange: (value: string) => void
  onRangeChange: (value: string) => void
  onScaleChange: (value: GpaScale) => void
  disabled?: boolean
  exactInputClassName?: string
  rangeInputClassName?: string
}

export function GpaProfileField({
  mode,
  exactValue,
  rangeValue,
  scaleValue,
  onModeChange,
  onExactChange,
  onRangeChange,
  onScaleChange,
  disabled = false,
  exactInputClassName = "",
  rangeInputClassName = "",
}: GpaProfileFieldProps) {
  const exactValueAsString = exactValue == null ? "" : String(exactValue)
  const gpaScaleMax = getGpaScaleMax(scaleValue)
  const validationMessage = mode === "exact" ? getExactGpaValidationMessage(exactValueAsString, scaleValue) : ""
  const normalizedExactGpa = normalizeGpaToFourPoint(exactValueAsString, scaleValue)
  const tierLabel = formatGpaTierLabel(
    normalizedExactGpa,
    rangeValue
  )

  return (
    <div className="rounded-2xl border border-slate-200 p-4 space-y-4 bg-slate-50/70">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <Label className="text-sm font-semibold">GPA Profile</Label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={mode === "exact" ? "default" : "outline"} onClick={() => onModeChange("exact")} disabled={disabled}>
          Exact GPA
        </Button>
        <Button type="button" variant={mode === "range" ? "default" : "outline"} onClick={() => onModeChange("range")} disabled={disabled}>
          GPA range
        </Button>
      </div>

      {mode === "exact" ? (
        <div className="space-y-2">
          <div className="space-y-2">
            <Label>GPA Scale</Label>
            <Select value={scaleValue} onValueChange={(value) => onScaleChange(value as GpaScale)} disabled={disabled}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select GPA scale" />
              </SelectTrigger>
              <SelectContent>
                {GPA_SCALE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Label htmlFor="gpa_exact">Exact GPA</Label>
            {tierLabel ? <Badge variant="outline">{tierLabel}</Badge> : null}
          </div>
          <Input
            id="gpa_exact"
            type="number"
            min="0"
            max={gpaScaleMax}
            step="0.01"
            value={exactValueAsString}
            onChange={(event) => onExactChange(event.target.value)}
            className={exactInputClassName}
            placeholder="3.84"
            disabled={disabled}
            aria-invalid={validationMessage ? "true" : "false"}
          />
          {validationMessage ? (
            <p className="text-xs text-red-600">{validationMessage}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              We validate against your selected scale and save a normalized 4.0 GPA for matching.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Label>Select the range that best fits your GPA</Label>
            {tierLabel ? <Badge variant="outline">{tierLabel}</Badge> : null}
          </div>
          <Select value={rangeValue || ""} onValueChange={onRangeChange} disabled={disabled}>
            <SelectTrigger className={rangeInputClassName}>
              <SelectValue placeholder="Choose your GPA range" />
            </SelectTrigger>
            <SelectContent>
              {GPA_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} - {option.tierLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Use a range if you do not want to enter an exact GPA yet.</p>
        </div>
      )}
    </div>
  )
}
