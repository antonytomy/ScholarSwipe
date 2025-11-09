import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Mail, MessageSquare, Clock } from "lucide-react"
import ContactForm from "@/components/contact-form"

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 py-12 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions, feedback, or need help? We'd love to hear from you. 
              Reach out and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">support@scholarswipe.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Response Time</h3>
                      <p className="text-muted-foreground">We typically respond within 24 hours</p>
                      <p className="text-sm text-muted-foreground">Email us for any questions or support</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Feedback Form */}
            <div className="rounded-3xl p-8 bg-white border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Send us Feedback</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Help us improve ScholarSwipe by sharing your thoughts, suggestions, or reporting any issues.
              </p>

              <ContactForm />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <div className="rounded-3xl p-8 bg-white border border-border shadow-sm">
              <h2 className="text-3xl font-bold text-foreground text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How does the AI matching work?</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your profile against scholarship requirements to calculate your win probability and show you the best matches.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Is ScholarSwipe free to use?</h3>
                    <p className="text-sm text-muted-foreground">
                      Yes! ScholarSwipe is completely free. No hidden fees, no credit card required.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">What makes ScholarSwipe different?</h3>
                    <p className="text-sm text-muted-foreground">
                      We combine a TikTok-style swipe interface with AI-powered matching to make scholarship discovery fast, easy, and personalized.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How many scholarships are available?</h3>
                    <p className="text-sm text-muted-foreground">
                      We have over 20,000 scholarships in our database, with more being added regularly.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Can I apply directly through ScholarSwipe?</h3>
                    <p className="text-sm text-muted-foreground">
                      Currently, we help you discover and save scholarships with direct links to apply. You'll complete applications on the scholarship provider's website.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How do I get started?</h3>
                    <p className="text-sm text-muted-foreground">
                      Simply sign up, complete your profile (takes 2 minutes), and start swiping through personalized scholarship matches!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

