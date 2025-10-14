# ScholarSwipe Frontend

AI-powered scholarship matching platform frontend built with Next.js and TypeScript.

## Features

- **Multi-step Registration**: Comprehensive student profile collection
- **Beautiful UI**: Modern design with glassmorphism effects
- **Responsive Design**: Works on all devices
- **Type Safety**: Full TypeScript support
- **Component Library**: Built with Radix UI and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Home page
│   ├── signup/         # Multi-step signup form
│   ├── login/          # Login page
│   └── swipe/          # Scholarship swiping interface
├── components/         # Reusable components
│   ├── ui/            # Base UI components
│   ├── navbar.tsx     # Navigation bar
│   ├── hero-section.tsx # Landing page hero
│   └── ...            # Other components
└── lib/               # Utilities and helpers
```

## Key Features Implemented

### Multi-Step Signup Form
- **Step 1**: Basic information (name, email, password)
- **Step 2**: Academic details (GPA, graduation year, major, academic level)
- **Step 3**: Additional information (ethnicity, first-generation status, financial need, location)

### Authentication Flow
- Clean login/signup pages
- Form validation
- Responsive design
- ScholarSwipe branding

### UI Components
- Glassmorphism design
- Smooth animations
- Mobile-responsive
- Accessible components

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Next Steps

- Connect to backend API
- Implement authentication state management
- Add scholarship swiping functionality
- Integrate with AI matching service
