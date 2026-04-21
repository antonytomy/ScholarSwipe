import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AddScholarshipForm from "@/components/add-scholarship-form"
import { ShieldCheck, Sparkles } from "lucide-react"

export default function AddScholarshipPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <section className="relative overflow-hidden px-4 py-16 sm:py-20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(33,62,153,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(245,197,24,0.14),transparent_35%)]" />
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Add Your Scholarship
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
                Share your scholarship with students already looking for it.
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Are you an organization or company offering a scholarship? Submit it here for review.
                Our team reviews every submission before it becomes publicly visible in Scholar Swipe.
              </p>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Professional review workflow with moderated publishing
              </div>
            </div>

            <AddScholarshipForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
