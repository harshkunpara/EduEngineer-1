import { useAuth } from "@/hooks/use-auth";
import { useEnrollments } from "@/hooks/use-enrollments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { Redirect } from "wouter";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: enrollments, isLoading: isEnrollmentsLoading } = useEnrollments();

  if (isAuthLoading) return null;
  if (!user) return <Redirect to="/auth" />;

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user.name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Welcome back, {user.name}!</h1>
              <p className="text-muted-foreground">Track your progress and continue learning.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          My Learning
        </h2>

        {isEnrollmentsLoading ? (
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="grid gap-6">
            {enrollments.map(({ enrollment, course }) => (
              <Card key={enrollment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Course Image Thumbnail */}
                  <div className="md:w-64 h-48 md:h-auto bg-muted relative">
                     <img 
                       src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60" 
                       alt={course.title}
                       className="w-full h-full object-cover"
                     />
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{course.category}</Badge>
                        <Badge 
                          variant={enrollment.status === 'paid' ? 'default' : 'secondary'}
                          className={enrollment.status === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {enrollment.status === 'paid' ? 'Active' : 'Pending Payment'}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">Instructor: {course.instructor}</p>
                      
                      {enrollment.status === 'paid' && (
                        <div className="w-full bg-secondary h-2 rounded-full mb-2">
                          <div className="bg-primary h-2 rounded-full w-[0%]"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>0% Completed</span>
                        </div>
                      </div>
                      
                      {enrollment.status === 'paid' ? (
                        <Button>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Continue Learning
                        </Button>
                      ) : (
                        <Button variant="secondary">Complete Payment</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Start your learning journey today.</p>
            <Button onClick={() => window.location.href='/courses'}>Browse Courses</Button>
          </div>
        )}
      </div>
    </div>
  );
}
