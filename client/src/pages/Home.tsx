import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Trophy, Users, Briefcase, Star, GraduationCap } from "lucide-react";
import { useCourses } from "@/hooks/use-courses";
import { CourseCard } from "@/components/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: courses, isLoading } = useCourses();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 md:py-32 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.2]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-accent mr-2 animate-pulse"></span>
                  New Batches Starting Soon
                </div>
                <h1 className="text-4xl font-display font-extrabold tracking-tight sm:text-6xl text-foreground">
                  Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Industry-Ready</span> Engineering Skills
                </h1>
                <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                  Join India's premier learning platform for engineering students. Learn from experts, build real projects, and launch your career.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Link href="/courses">
                  <Button size="lg" className="text-base h-12 px-8 shadow-lg shadow-primary/25">
                    Explore Courses
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button size="lg" variant="outline" className="text-base h-12 px-8">
                    Start for Free
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold">4.7 / 5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-bold">12,000+ students learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <span className="font-bold">Certificate of Completion</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3 italic">
                Trusted by thousands of engineering students across India.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mx-auto lg:ml-auto aspect-square w-full max-w-[500px]"
            >
              {/* Abstract decorative elements */}
              <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              
              <div className="relative h-full w-full overflow-hidden rounded-2xl border shadow-2xl bg-card">
                 {/* Indian engineering students collaboration image */}
                 <img 
                   src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60" 
                   alt="Students learning" 
                   className="h-full w-full object-cover"
                 />
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                   <p className="font-medium">"The best investment in your career"</p>
                   <p className="text-sm opacity-80">- Amit P., Software Engineer at Google</p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold tracking-tight sm:text-4xl">Why Choose EduEngineer?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We bridge the gap between academic curriculum and industry requirements.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Trophy className="h-8 w-8 text-accent" />,
                title: "Industry Certified",
                description: "Curriculum designed by experts from top tech companies."
              },
              {
                icon: <Briefcase className="h-8 w-8 text-primary" />,
                title: "Project Based Learning",
                description: "Don't just watch videos. Build real projects for your portfolio."
              },
              {
                icon: <Users className="h-8 w-8 text-green-500" />,
                title: "Mentorship Support",
                description: "Get your doubts resolved by experienced mentors 24/7."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight">Popular Courses</h2>
              <p className="text-muted-foreground mt-2">Top rated by engineering students across India</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="hidden sm:flex group">
                View All 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {courses?.slice(0, 3).map((course) => (
                <motion.div key={course.id} variants={item}>
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/courses">
              <Button variant="outline" className="w-full">View All Courses</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-display font-bold mb-6">Ready to Kickstart Your Engineering Career?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of successful graduates working at top companies like Google, Microsoft, and Amazon.
          </p>
          <Link href="/auth?tab=register">
            <Button size="lg" variant="secondary" className="text-primary font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
