import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { GraduationCap, Users, Target, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
              About ScholarSwipe
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to make scholarship discovery as easy as swiping right, 
              powered by AI to match students with the perfect funding opportunities.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Our Story */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  ScholarSwipe was born from a simple observation: finding the right scholarships 
                  shouldn't feel like searching for a needle in a haystack. As students ourselves, 
                  we experienced the frustration of spending countless hours scrolling through 
                  endless scholarship databases, only to find opportunities that didn't quite fit.
                </p>
                <p>
                  We realized that the traditional approach to scholarship discovery was broken. 
                  Students were drowning in information but starving for personalized, actionable 
                  opportunities that matched their unique profiles and goals.
                </p>
                <p>
                  That's when we decided to revolutionize the process. By combining the familiar 
                  swipe interface that students love with powerful AI matching technology, we've 
                  created a platform that makes scholarship discovery not just efficient, but 
                  genuinely enjoyable.
                </p>
              </div>
            </div>

            {/* Team Photo Placeholder */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Users className="w-16 h-16 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Our Team</h3>
                    <p className="text-sm text-muted-foreground">
                      [Photo placeholder - Add your team photo here]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission & Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="glass-card-advanced rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Our Mission</h3>
              <p className="text-muted-foreground">
                To democratize access to educational funding by making scholarship discovery 
                personalized, efficient, and accessible to every student.
              </p>
            </div>

            <div className="glass-card-advanced rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Our Vision</h3>
              <p className="text-muted-foreground">
                A world where every student can easily find and secure the funding they need 
                to pursue their educational dreams without barriers.
              </p>
            </div>

            <div className="glass-card-advanced rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Our Values</h3>
              <p className="text-muted-foreground">
                Student-first approach, transparency, innovation, and a commitment to making 
                education accessible to all, regardless of background or circumstances.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card-advanced rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-12">Making an Impact</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-muted-foreground">Students Helped</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  $2M+
                </div>
                <div className="text-muted-foreground">Scholarships Discovered</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-muted-foreground">Active Scholarships</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  95%
                </div>
                <div className="text-muted-foreground">Match Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
