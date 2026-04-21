import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, GraduationCap } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-2xl mx-auto text-center">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-8">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>

          {/* 404 Text */}
          <h1 className="text-8xl md:text-9xl font-bold text-primary mb-4">404</h1>

          {/* Message */}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Page Not Found</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Oops! The scholarship you're looking for seems to have been awarded already. Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-secondary text-black hover:bg-secondary/90 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/50 font-semibold"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Go Back Home
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="glass-card hover:bg-card/50 transition-all duration-300 hover:scale-105 bg-transparent"
            >
              <Link href="/swipe" className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse Scholarships
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-muted-foreground mt-8">
            Need help?{" "}
            <a href="/#about" className="text-primary hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
