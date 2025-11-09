import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 py-12 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-8 md:p-12 space-y-8 bg-white border border-border shadow-sm">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-primary">
                Terms of Service
              </h1>
              <p className="text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="prose prose-lg max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using ScholarSwipe ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ScholarSwipe is an AI-powered scholarship matching platform that helps students discover and apply for educational funding opportunities. Our service includes scholarship recommendations, application tracking, and educational resources.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">4. Privacy and Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices. We collect and use your information to provide personalized scholarship recommendations and improve our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">5. Scholarship Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  While we strive to provide accurate and up-to-date scholarship information, we cannot guarantee the accuracy, completeness, or timeliness of all scholarship data. Users should verify all scholarship details directly with the scholarship providers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">6. User Responsibilities</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide accurate and truthful information in your profile</li>
                  <li>Use the Service only for lawful purposes</li>
                  <li>Respect intellectual property rights</li>
                  <li>Not attempt to gain unauthorized access to the Service</li>
                  <li>Not use the Service to spam or harass others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ScholarSwipe shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">8. Modifications to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">9. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Email: support@scholarswipe.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
