# Scholar Swipe

A modern scholarship discovery app with AI-powered matching. Swipe through personalized scholarships and find funding for your education.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env.local
   ```
   Add your Supabase credentials to `.env.local`

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open:** [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Next.js 15** - Full-stack React framework
- **Supabase** - Database & authentication
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## 📁 Project Structure

```
├── app/                 # Next.js pages & API routes
├── components/          # React components
├── lib/                # Utilities & database client
├── public/             # Static assets
└── package.json        # Dependencies
```

## 🔑 Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
```

## 📱 Features

- User authentication & profiles
- AI-powered scholarship matching
- TikTok-style swipe interface
- Save & track scholarships
- Responsive design

## 🚀 Deployment

Ready for Vercel, Netlify, or any Next.js hosting platform.