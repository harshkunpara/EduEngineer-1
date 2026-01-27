import { Link } from "wouter";
import { type Course } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, IndianRupee } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  // Use category to determine image
  const getCourseImage = (category: string) => {
    const images: Record<string, string> = {
      "Computer Science": "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=60",
      "Data Science": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
      "Electronics": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
      "Civil": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60",
    };
    return images[category] || images["Computer Science"];
  };

  return (
    <Card className="group overflow-hidden border transition-all hover:shadow-lg hover:border-primary/50">
      <div className="aspect-video w-full overflow-hidden bg-muted relative">
        {/* Descriptive alt for accessibility */}
        <img
          src={getCourseImage(course.category)}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-primary font-bold">
            {course.category}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-4 pb-2">
        <h3 className="line-clamp-1 font-display text-xl font-bold">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
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
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t bg-muted/20 p-4">
        <div className="flex items-center font-bold text-lg text-primary">
          <IndianRupee className="h-4 w-4" />
          {course.price.toLocaleString("en-IN")}
        </div>
        <Link href={`/courses/${course.id}`}>
          <Button className="font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
