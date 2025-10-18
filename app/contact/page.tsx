import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Mail, Phone, MapPin, MessageSquare, Clock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">support@scholarswipe.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Office</h3>
                      <p className="text-muted-foreground">
                        123 Education Street<br />
                        San Francisco, CA 94105<br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Response Time</h3>
                      <p className="text-muted-foreground">We typically respond within 24 hours</p>
                      <p className="text-sm text-muted-foreground">For urgent matters, please call us</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Feedback Form */}
            <div className="glass-card-advanced rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Send us Feedback</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Help us improve ScholarSwipe by sharing your thoughts, suggestions, or reporting any issues.
              </p>

              {/* Google Form Embed */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Feedback Form</h3>
                  <p className="text-muted-foreground mb-4">
                    [Google Form or Airtable embed will go here]
                  </p>
                  <div className="bg-white rounded-xl p-8 border-2 border-dashed border-muted-foreground/30">
                    <p className="text-muted-foreground text-sm">
                      📝 Form placeholder<br />
                      Replace this with your Google Form or Airtable embed
                    </p>
                  </div>
                </div>

                {/* Alternative: Direct links */}
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full"
                  >
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      Google Form
                    </a>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full"
                  >
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      Airtable Form
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <div className="glass-card-advanced rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-foreground text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How does the AI matching work?</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your profile, academic achievements, and preferences to match you with scholarships you're most likely to win.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Is ScholarSwipe free to use?</h3>
                    <p className="text-sm text-muted-foreground">
                      Yes! Our basic features are completely free. Premium features may be available in the future.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How often are scholarships updated?</h3>
                    <p className="text-sm text-muted-foreground">
                      We update our scholarship database daily to ensure you have access to the latest opportunities.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Can I apply directly through ScholarSwipe?</h3>
                    <p className="text-sm text-muted-foreground">
                      Currently, we help you discover and save scholarships. You'll apply directly on the scholarship provider's website.
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
