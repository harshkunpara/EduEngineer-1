import { Link } from "wouter";
import { type Course } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, IndianRupee, Star, Users, Award } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden border transition-all hover:shadow-lg hover:border-primary/50">
      <CardHeader className="p-5 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-medium">
            {course.category}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">4.7</span>
          </div>
        </div>
        <h3 className="line-clamp-2 font-display text-xl font-bold leading-tight">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-primary" />
            {course.syllabus.length} Modules
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>12,000+ learners</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-3.5 w-3.5" />
            <span>Certificate</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t bg-muted/20 p-4">
        <div className="flex items-center font-bold text-lg text-primary">
          <IndianRupee className="h-4 w-4" />
          {course.price.toLocaleString("en-IN")}
        </div>
        <Link href={`/courses/${course.id}`}>
          <Button data-testid={`button-view-course-${course.id}`} className="font-semibold">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
