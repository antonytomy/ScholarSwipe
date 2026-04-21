import { NextRequest, NextResponse } from 'next/server'

interface ParsedCommonAppData {
    full_name: string
    email: string
    phone: string
    dob: string
    gender: string
    education_level: string
    school: string
    gpa: string
    graduation_year: string
    sat_score: string
    act_score: string
    intended_major: string
    academic_year: string
    ethnicity: string
    citizenship: string
    first_generation: boolean
    location_state: string
    disabilities: string
    military: boolean
    income_range: string
}

function extractField(text: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
            return match[1].trim()
        }
    }
    return ''
}

function extractSection(text: string, startPatterns: RegExp[], endPatterns: RegExp[]): string {
    let startIndex = -1
    for (const pattern of startPatterns) {
        const match = text.search(pattern)
        if (match !== -1) {
            startIndex = match
            // Move past the header line
            const headerEnd = text.indexOf('\n', startIndex)
            if (headerEnd !== -1) startIndex = headerEnd + 1
            break
        }
    }
    if (startIndex === -1) return ''

    let endIndex = text.length
    for (const pattern of endPatterns) {
        const match = text.slice(startIndex).search(pattern)
        if (match !== -1) {
            endIndex = startIndex + match
            break
        }
    }

    return text.slice(startIndex, endIndex).trim()
}

function mapGenderValue(raw: string): string {
    const lower = raw.toLowerCase()
    if (lower.includes('male') && !lower.includes('female')) return 'male'
    if (lower.includes('female')) return 'female'
    if (lower.includes('non-binary') || lower.includes('nonbinary')) return 'non-binary'
    return 'prefer-not-to-say'
}

function mapEthnicityValue(raw: string): string {
    const lower = raw.toLowerCase()
    if (lower.includes('asian')) return 'asian'
    if (lower.includes('black') || lower.includes('african')) return 'black'
    if (lower.includes('hispanic') || lower.includes('latino') || lower.includes('latina')) return 'hispanic'
    if (lower.includes('native american') || lower.includes('indigenous') || lower.includes('american indian')) return 'native_american'
    if (lower.includes('pacific islander') || lower.includes('hawaiian')) return 'pacific_islander'
    if (lower.includes('white') || lower.includes('caucasian')) return 'white'
    if (lower.includes('mixed') || lower.includes('multiracial') || lower.includes('two or more')) return 'mixed'
    return 'other'
}

function mapCitizenshipValue(raw: string): string {
    const lower = raw.toLowerCase()
    if (lower.includes('u.s. citizen') || lower.includes('us citizen') || lower.includes('united states citizen')) return 'us_citizen'
    if (lower.includes('permanent resident') || lower.includes('green card')) return 'permanent_resident'
    if (lower.includes('international')) return 'international_student'
    if (lower.includes('daca')) return 'daca'
    return 'other'
}

function mapEducationLevel(raw: string): string {
    const lower = raw.toLowerCase()
    if (lower.includes('high school') || lower.includes('secondary')) return 'high_school'
    if (lower.includes('community college') || lower.includes('associate')) return 'community_college'
    if (lower.includes('graduate') || lower.includes('master') || lower.includes('doctoral') || lower.includes('phd')) return 'graduate'
    if (lower.includes('undergraduate') || lower.includes('college') || lower.includes('university') || lower.includes('bachelor')) return 'undergraduate'
    return ''
}

function parseCommonAppText(text: string): ParsedCommonAppData {
    const result: ParsedCommonAppData = {
        full_name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        education_level: '',
        school: '',
        gpa: '',
        graduation_year: '',
        sat_score: '',
        act_score: '',
        intended_major: '',
        academic_year: '',
        ethnicity: '',
        citizenship: '',
        first_generation: false,
        location_state: '',
        disabilities: '',
        military: false,
        income_range: '',
    }

    // --- Name ---
    // Common App PDFs have the name under "Profile > Personal information".
    // Look for the "Personal information" header and read the next line as the full name.
    const personalInfoMatch = text.match(/Personal\s+information\s*\n\s*(.+)/i)
    if (personalInfoMatch) {
        let nameLine = personalInfoMatch[1].trim()
        // Strip leading "Name" label if present (e.g. "Name Askharoun, Demiana W")
        nameLine = nameLine.replace(/^Name\s+/i, '')
        // Rearrange "LastName, FirstName MiddleInitial" → "FirstName MiddleInitial LastName"
        const commaMatch = nameLine.match(/^(.+?),\s*(.+)$/)
        if (commaMatch) {
            nameLine = `${commaMatch[2].trim()} ${commaMatch[1].trim()}`
        }
        result.full_name = nameLine
    } else {
        // Fallback: try explicit "First name" / "Last name" labels
        const firstNameMatch = text.match(/First\s*name\s*\n\s*([A-Za-z\-']+)/i)
            || text.match(/(?:first\s*name|given\s*name)\s*[:\-]?\s*([A-Za-z][a-zA-Z\-']+)/i)
        const lastNameMatch = text.match(/(?:Last|Family)\s*name\s*\n\s*([A-Za-z\-']+)/i)
            || text.match(/(?:last\s*name|family\s*name|surname)\s*[:\-]?\s*([A-Za-z][a-zA-Z\-']+)/i)
        const firstName = firstNameMatch ? firstNameMatch[1].trim() : ''
        const lastName = lastNameMatch ? lastNameMatch[1].trim() : ''
        if (firstName && lastName) {
            result.full_name = `${firstName} ${lastName}`
        } else if (firstName) {
            result.full_name = firstName
        } else {
            result.full_name = extractField(text, [
                /(?:legal\s*name|full\s*name)\s*[:\-]?\s*([A-Z][a-zA-Z\-']+(?:\s+[A-Z][a-zA-Z\-']+)+)/i,
            ])
        }
    }

    // --- Email ---
    const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) result.email = emailMatch[0]

    // --- Phone ---
    const phoneMatch = text.match(/(?:phone|tel|mobile|cell)\s*[:\-]?\s*(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/i)
        || text.match(/(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)
    if (phoneMatch) result.phone = phoneMatch[1] || phoneMatch[0]

    // --- Date of Birth ---
    const dobMatch = text.match(/(?:date\s*of\s*birth|d\.?o\.?b\.?|birth\s*date|born)\s*[:\-]?\s*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i)
        || text.match(/(?:date\s*of\s*birth|d\.?o\.?b\.?|birth\s*date|born)\s*[:\-]?\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i)
    if (dobMatch) {
        const rawDob = dobMatch[1]
        // Try to convert to YYYY-MM-DD format
        const dateObj = new Date(rawDob)
        if (!isNaN(dateObj.getTime())) {
            result.dob = dateObj.toISOString().split('T')[0]
        } else {
            result.dob = rawDob
        }
    }

    // --- Gender ---
    const genderRaw = extractField(text, [
        /(?:sex|gender)\s*[:\-]?\s*([A-Za-z\-\s]+?)(?:\n|$)/i,
    ])
    if (genderRaw) result.gender = mapGenderValue(genderRaw)

    // --- School ---
    // Common App PDFs list the school under "Current or most recent secondary school"
    // The school name appears on the line(s) following that header.
    const schoolSectionMatch = text.match(/[Cc]urrent\s+(?:or\s+most\s+recent\s+)?[Ss]econdary\s+[Ss]chool[\s\S]*?\n\s*(.+)/)
    if (schoolSectionMatch) {
        // The captured group should be the school name line
        result.school = schoolSectionMatch[1].trim()
    } else {
        result.school = extractField(text, [
            /(?:current\s*school|secondary\s*school|high\s*school|school\s*name)\s*[:\-]?\s*(.+?)(?:\n|$)/i,
        ])
    }

    // --- GPA ---
    const gpaMatch = text.match(/(?:gpa|grade\s*point\s*average|cumulative\s*gpa)\s*[:\-]?\s*(\d\.\d{1,2})/i)
    if (gpaMatch) result.gpa = gpaMatch[1]

    // --- Graduation Year ---
    const gradMatch = text.match(/(?:graduation|grad|expected\s*graduation|class\s*of)\s*[:\-]?\s*(\d{4})/i)
    if (gradMatch) result.graduation_year = gradMatch[1]

    // --- SAT ---
    const satMatch = text.match(/(?:sat)\s*(?:score|total)?\s*[:\-]?\s*(\d{3,4})/i)
    if (satMatch) {
        const score = parseInt(satMatch[1])
        if (score >= 400 && score <= 1600) result.sat_score = satMatch[1]
    }

    // --- ACT ---
    const actMatch = text.match(/(?:act)\s*(?:score|composite)?\s*[:\-]?\s*(\d{1,2})/i)
    if (actMatch) {
        const score = parseInt(actMatch[1])
        if (score >= 1 && score <= 36) result.act_score = actMatch[1]
    }

    // --- Intended Major ---
    // Leave blank — Common App PDFs don't reliably contain this field,
    // and the broad regex was picking up false matches.
    result.intended_major = ''

    // --- Education Level ---
    const eduRaw = extractField(text, [
        /(?:education\s*level|current\s*level|grade\s*level|year)\s*[:\-]?\s*(.+?)(?:\n|$)/i,
    ])
    if (eduRaw) {
        result.education_level = mapEducationLevel(eduRaw)
    }
    // If not found, infer from context
    if (!result.education_level) {
        if (/high\s*school|secondary/i.test(text) && !/college|university/i.test(result.school || '')) {
            result.education_level = 'high_school'
        } else if (/undergraduate|college|university/i.test(text)) {
            result.education_level = 'undergraduate'
        }
    }

    // --- Ethnicity ---
    const ethnicityRaw = extractField(text, [
        /(?:race|ethnicity|ethnic\s*background)\s*[:\-]?\s*(.+?)(?:\n|$)/i,
    ])
    if (ethnicityRaw) {
        const mappedEthnicity = mapEthnicityValue(ethnicityRaw)
        // Don't fill if mapped to 'other' — it's likely a false match
        if (mappedEthnicity !== 'other') result.ethnicity = mappedEthnicity
    }

    // --- Citizenship ---
    const citizenshipRaw = extractField(text, [
        /(?:citizenship|citizenship\s*status|citizen)\s*[:\-]?\s*(.+?)(?:\n|$)/i,
    ])
    if (citizenshipRaw) {
        const mappedCitizenship = mapCitizenshipValue(citizenshipRaw)
        // Don't fill if mapped to 'other' — it's likely a false match
        if (mappedCitizenship !== 'other') result.citizenship = mappedCitizenship
    }

    // --- State ---
    // Try to parse the state from the school address block.
    // Common App school addresses typically include a US state abbreviation (e.g. "PA", "NY")
    // Look near the school section for a state pattern like "City, ST ZIP"
    const US_STATES: Record<string, string> = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
        'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
        'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
        'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
        'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
        'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
    }
    // First try to find state near the school section (address typically follows school name)
    const schoolContextStart = text.search(/[Cc]urrent\s+(?:or\s+most\s+recent\s+)?[Ss]econdary\s+[Ss]chool/)
    const schoolContext = schoolContextStart !== -1
        ? text.slice(schoolContextStart, schoolContextStart + 500)
        : text
    // Look for "City, ST ZIP" pattern (most common US address format)
    const stateAbbrMatch = schoolContext.match(/,\s*([A-Z]{2})\s+\d{5}/)
    if (stateAbbrMatch && US_STATES[stateAbbrMatch[1]]) {
        result.location_state = stateAbbrMatch[1]
    } else {
        // Fallback: look for any two-letter state abbreviation in the school context
        const stateAbbrs = Object.keys(US_STATES)
        const allAbbrPattern = new RegExp(`\\b(${stateAbbrs.join('|')})\\b`)
        const fallbackMatch = schoolContext.match(allAbbrPattern)
        if (fallbackMatch && US_STATES[fallbackMatch[1]]) {
            result.location_state = fallbackMatch[1]
        } else {
            // Last resort: original generic extraction
            result.location_state = extractField(text, [
                /(?:state|home\s*state|state\s*of\s*residence|state\/province)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|$)/i,
            ])
        }
    }

    // --- First Generation ---
    result.first_generation = /first[\s\-]generation/i.test(text)

    // --- Military ---
    result.military = /(?:veteran|military\s*service|armed\s*forces|military\s*family)/i.test(text)

    return result
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('pdf') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'No PDF file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Please upload a valid PDF file' },
                { status: 400 }
            )
        }

        // Validate file size (max 10MB)
        const MAX_SIZE = 10 * 1024 * 1024
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File size must be under 10MB' },
                { status: 400 }
            )
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // pdf-parse v2 uses PDFParse class with getText()
        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: uint8Array })
        const result = await parser.getText()
        await parser.destroy()
        const text = result.text

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'Could not extract text from the PDF. The file may be scanned or image-based.' },
                { status: 400 }
            )
        }

        // Parse the Common App text into form fields
        const parsedData = parseCommonAppText(text)

        // Count how many fields were successfully extracted
        const fieldsExtracted = Object.entries(parsedData).filter(
            ([key, value]) => {
                if (typeof value === 'boolean') return false // Don't count booleans
                return value && value.toString().trim().length > 0
            }
        ).length

        return NextResponse.json({
            success: true,
            data: parsedData,
            fieldsExtracted,
            totalFields: Object.keys(parsedData).length,
            message: `Successfully extracted ${fieldsExtracted} fields from your Common App PDF.`
        })

    } catch (error) {
        console.error('PDF parsing error:', error)
        const errMsg = error instanceof Error ? error.message : String(error)
        const errStack = error instanceof Error ? error.stack : ''
        console.error('PDF error details:', { message: errMsg, stack: errStack, name: error instanceof Error ? error.name : 'unknown' })
        return NextResponse.json(
            { error: `Failed to parse the PDF: ${errMsg}. Please try again or fill in the form manually.` },
            { status: 500 }
        )
    }
}
