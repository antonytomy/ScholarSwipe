"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { GraduationCap, Heart, Sparkles, Target, Zap, Users } from "lucide-react"
import Image from "next/image"

const teamMembers = [
  {
    name: "Arin Sajwan",
    image: "/arin_sajwan_portrait.png",
  },
  {
    name: "Antony Tomy",
    image: "/antony_tomy_portrait.png",
  },
  {
    name: "David Martinez",
    image: "/david_martinez.png",
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">About Us</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 text-balance">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Empowering Students.
              </span>
              <br />
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Simplifying Scholarships.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              ScholarSwipe helps students discover personalized scholarships in seconds — no more long searches 
              or confusing databases. Just swipe, match, and apply.
            </p>
          </div>
        </section>

        {/* Supported & Trusted By Section */}
        <section className="py-16 px-4 border-y border-border/50 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Supported & Trusted By
              </h2>
              <p className="text-muted-foreground">
                Partnering with leading organizations to empower student success
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-16 items-center justify-items-center">
              <div className="w-full max-w-[400px] h-40 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                <Image
                  src="/young_entrepreneurs_academy.png"
                  alt="Young Entrepreneurs Academy"
                  fill
                  className="object-contain"
                  sizes="400px"
                />
              </div>
              
              <div className="w-full max-w-[400px] h-40 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                <Image
                  src="/harrisburg_university.png"
                  alt="Harrisburg University"
                  fill
                  className="object-contain"
                  sizes="400px"
                />
              </div>
              
              <div className="w-full max-w-[400px] h-40 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                <Image
                  src="/penn_state_launchbox.png"
                  alt="Penn State LaunchBox"
                  fill
                  className="object-contain"
                  sizes="400px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section - Side by Side */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - Text */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Our Mission</span>
                </div>
                
                <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  We're reimagining the scholarship search for the next generation.
                </h2>
                
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    ScholarSwipe uses AI to match students with scholarships that fit their goals, background, 
                    and academic path — fast, easy, and accurate.
                  </p>
                  <p>
                    We believe finding scholarships shouldn't be a full-time job. That's why we created a platform 
                    that brings the familiar swipe interface students already love to scholarship discovery.
                  </p>
                </div>
              </div>

              {/* Right side - Visual */}
              <div className="relative">
                <div className="glass-card-advanced rounded-3xl p-12 space-y-8">
                  {/* Icon Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-white" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-yellow-500 p-6 flex items-center justify-center">
                      <Zap className="w-16 h-16 text-white" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-yellow-500 p-6 flex items-center justify-center">
                      <Heart className="w-16 h-16 text-white" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-accent p-6 flex items-center justify-center">
                      <GraduationCap className="w-16 h-16 text-white" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      The Future of Scholarship Discovery
                    </h3>
                    <p className="text-muted-foreground">
                      AI-powered matching meets intuitive design to create the scholarship search experience students deserve.
                    </p>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-secondary/10 rounded-full blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">The Team</span>
              </div>
              
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Meet the Founders</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built by students, for students. We understand the scholarship struggle because we've lived it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <div
                  key={i}
                  className="glass-card-advanced rounded-2xl p-8 text-center space-y-6 hover-lift transition-all duration-300"
                >
                  <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl opacity-20" />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary/20">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className={member.name === "Antony Tomy" ? "object-cover scale-110" : "object-cover"}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Team description */}
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed">
                We're a team of students from the Lehigh Valley who came together with a shared mission: 
                make scholarship discovery as intuitive as swiping through your favorite app. Combined with 
                AI technology, we're building the future of educational funding.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card-advanced rounded-3xl p-12">
              <div className="text-center mb-12">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Our Impact</h2>
                <p className="text-xl text-muted-foreground">
                  Building the future of scholarship discovery, one swipe at a time.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-12">
                <div className="text-center space-y-3">
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    20,000+
                  </div>
                  <div className="text-muted-foreground font-medium">Scholarships Available</div>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                    100+
                  </div>
                  <div className="text-muted-foreground font-medium">Students on Waiting List</div>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                    AI-Powered
                  </div>
                  <div className="text-muted-foreground font-medium">Smart Matching</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Ready to find your perfect scholarship match?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the waiting list and be among the first to experience the future of scholarship discovery.
            </p>
            <div>
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50"
              >
                Get Started Free
                <Sparkles className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • 2 minute setup
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
