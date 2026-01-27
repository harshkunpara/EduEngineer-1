import { useCourse } from "@/hooks/use-courses";
import { useEnrollAndPay } from "@/hooks/use-enrollments";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, Globe, IndianRupee, Loader2, ShieldCheck, User, Star, Users, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetails() {
  const [match, params] = useRoute("/courses/:id");
  const id = parseInt(params?.id || "0");
  const { data: course, isLoading } = useCourse(id);
  const enrollMutation = useEnrollAndPay();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to enroll in this course.",
        variant: "destructive",
      });
      return;
    }
    if (course) {
      enrollMutation.mutate({ courseId: course.id, amount: course.price });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!course) return <div>Course not found</div>;

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Course Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <Badge variant="outline" className="text-primary border-primary">
                {course.category}
              </Badge>
              <h1 className="text-4xl font-display font-bold tracking-tight lg:text-5xl">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Instructor: <span className="font-semibold">{course.instructor}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Language: <span className="font-semibold">English</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last updated: <span className="font-semibold">Last Month</span></span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-2 text-sm bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold">4.7 / 5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-bold">12,000+ students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
                  <span className="font-bold">Certificate of Completion</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground italic">
                Trusted by thousands of engineering students across India.
              </p>
            </div>

            {/* Sticky Enrollment Card */}
            <div className="relative">
              <div className="lg:absolute lg:top-0 lg:right-0 w-full lg:w-[380px] bg-card border rounded-2xl shadow-xl p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                    <IndianRupee className="h-6 w-6" />
                    {course.price.toLocaleString("en-IN")}
                  </div>
                  <p className="text-sm text-muted-foreground line-through">
                    <IndianRupee className="inline h-3 w-3" /> 
                    {(course.price * 1.5).toLocaleString("en-IN")}
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full text-lg font-bold shadow-lg shadow-primary/25"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : "Enroll Now"}
                </Button>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{course.duration} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span>Full lifetime access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            
            {/* What you'll learn */}
            <div className="border rounded-2xl p-8 bg-card">
              <h2 className="text-2xl font-bold mb-6">What you'll learn</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Master core concepts and advanced techniques",
                  "Build real-world projects for your portfolio",
                  "Understand industry best practices",
                  "Get ready for technical interviews"
                ].map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
              <Accordion type="single" collapsible className="w-full border rounded-xl bg-card">
                {course.syllabus.map((topic, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="px-4">
                    <AccordionTrigger className="hover:no-underline hover:text-primary">
                      <div className="flex gap-4 text-left">
                        <span className="text-muted-foreground font-mono text-sm pt-1">
                          Module {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{topic}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-14">
                      Detailed curriculum breakdown for this module including video lectures, quizzes, and hands-on exercises.
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
