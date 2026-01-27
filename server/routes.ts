import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import pgSession from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);
const PgStore = pgSession(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      store: new PgStore({ pool, tableName: 'session' }),
      secret: process.env.SESSION_SECRET || "edu-engineer-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport Configuration
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByEmail(username);
        if (!user) return done(null, false, { message: "Incorrect email." });
        if (!(await comparePasswords(password, user.password)))
          return done(null, false, { message: "Incorrect password." });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Email domain validation
  const fakeDomains = ["example.com", "example.org", "example.net", "test.com", "fake.com", "dummy.com"];
  const isValidEmailDomain = (email: string) => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    return !fakeDomains.includes(domain);
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      // Validate email domain
      if (!isValidEmailDomain(input.email)) {
        return res.status(400).json({ 
          message: "Please enter a valid email address (example: yourname@gmail.com).",
          field: "email"
        });
      }

      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.status(401).json({ message: "Admin only" });
    next();
  };

  // Course Routes
  app.get(api.courses.list.path, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get(api.courses.get.path, async (req, res) => {
    const course = await storage.getCourse(Number(req.params.id));
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  });

  app.post(api.courses.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.courses.create.input.parse(req.body);
      const course = await storage.createCourse(input);
      res.status(201).json(course);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.courses.delete.path, requireAdmin, async (req, res) => {
    await storage.deleteCourse(Number(req.params.id));
    res.status(204).send();
  });

  // Enrollment Routes
  app.get(api.enrollments.list.path, requireAuth, async (req, res) => {
    const enrollments = await storage.getEnrollments(req.user!.id);
    res.json(enrollments);
  });

  app.post(api.enrollments.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.enrollments.create.input.parse(req.body);
      const enrollment = await storage.createEnrollment({
        userId: req.user!.id,
        courseId: input.courseId,
        status: "pending",
      });
      res.status(201).json(enrollment);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.enrollments.verifyPayment.path, requireAuth, async (req, res) => {
    try {
      const { enrollmentId, razorpayPaymentId } = req.body;
      // In production, verify signature here using razorpay-node
      // For this demo/test mode, we accept the paymentId
      await storage.updateEnrollmentStatus(enrollmentId, "paid", razorpayPaymentId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false });
    }
  });

  // Seed Data
  if ((await storage.getCourses()).length === 0) {
    console.log("Seeding courses...");
    await storage.createCourse({
      title: "Java Programming Masterclass",
      description: "Complete Java programming from scratch. Learn OOP, Collections, and Multithreading.",
      price: 2999,
      duration: "40 Hours",
      instructor: "Dr. Anjali Sharma",
      syllabus: ["Introduction to Java", "OOPs Concepts", "Exception Handling", "Collections Framework", "Multithreading"],
      category: "Programming",
    });
    await storage.createCourse({
      title: "Python for Data Science",
      description: "Master Python and libraries like NumPy, Pandas, and Matplotlib for data analysis.",
      price: 3499,
      duration: "35 Hours",
      instructor: "Rahul Verma",
      syllabus: ["Python Basics", "Data Structures", "NumPy & Pandas", "Data Visualization", "Mini Project"],
      category: "Data Science",
    });
    await storage.createCourse({
      title: "Full Stack Web Development",
      description: "Become a Full Stack Developer with the complete MERN Stack bootcamp.",
      price: 4999,
      duration: "60 Hours",
      instructor: "Sandeep Singh",
      syllabus: ["HTML/CSS/JS", "React.js", "Node.js & Express", "MongoDB", "Deployment"],
      category: "Web Development",
    });
    await storage.createCourse({
      title: "Data Structures & Algorithms",
      description: "Ace your coding interviews with comprehensive DSA in C++ and Java.",
      price: 3999,
      duration: "50 Hours",
      instructor: "Amit Patel",
      syllabus: ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Greedy Algorithms"],
      category: "Computer Science",
    });
    await storage.createCourse({
      title: "C & C++ Programming",
      description: "Master C and C++ programming languages from basics to advanced concepts.",
      price: 2499,
      duration: "45 Hours",
      instructor: "Prof. Suresh Kumar",
      syllabus: ["C Fundamentals", "Pointers & Memory", "C++ OOP", "STL Library", "File Handling"],
      category: "Programming",
    });
    await storage.createCourse({
      title: "React JS Complete Guide",
      description: "Build modern web applications with React, Hooks, Redux, and Next.js.",
      price: 3299,
      duration: "38 Hours",
      instructor: "Priya Nair",
      syllabus: ["React Basics", "Hooks & Context", "Redux Toolkit", "React Router", "Next.js"],
      category: "Web Development",
    });
    await storage.createCourse({
      title: "Node.js Backend Development",
      description: "Build scalable backend applications with Node.js, Express, and databases.",
      price: 3199,
      duration: "32 Hours",
      instructor: "Vikram Reddy",
      syllabus: ["Node.js Basics", "Express Framework", "REST APIs", "Authentication", "Database Integration"],
      category: "Web Development",
    });
    await storage.createCourse({
      title: "Machine Learning with Python",
      description: "Learn ML algorithms, Scikit-Learn, TensorFlow and build AI projects.",
      price: 5499,
      duration: "55 Hours",
      instructor: "Dr. Meera Iyer",
      syllabus: ["ML Fundamentals", "Supervised Learning", "Unsupervised Learning", "Neural Networks", "Real Projects"],
      category: "Data Science",
    });
    await storage.createCourse({
      title: "SQL & Database Management",
      description: "Master SQL, MySQL, PostgreSQL and database design principles.",
      price: 2299,
      duration: "28 Hours",
      instructor: "Ramesh Gupta",
      syllabus: ["SQL Basics", "Joins & Subqueries", "Database Design", "Performance Tuning", "NoSQL Introduction"],
      category: "Computer Science",
    });
    await storage.createCourse({
      title: "Cyber Security Fundamentals",
      description: "Learn ethical hacking, network security, and protect systems from threats.",
      price: 4499,
      duration: "42 Hours",
      instructor: "Arjun Menon",
      syllabus: ["Security Basics", "Network Security", "Ethical Hacking", "Cryptography", "Security Tools"],
      category: "Computer Science",
    });
    await storage.createCourse({
      title: "Cloud Computing with AWS",
      description: "Master Amazon Web Services - EC2, S3, Lambda, and cloud architecture.",
      price: 4999,
      duration: "48 Hours",
      instructor: "Neha Saxena",
      syllabus: ["Cloud Fundamentals", "EC2 & S3", "Lambda & Serverless", "DevOps on AWS", "Certification Prep"],
      category: "Cloud",
    });
    await storage.createCourse({
      title: "DevOps Engineering",
      description: "Learn CI/CD, Docker, Kubernetes, Jenkins and modern DevOps practices.",
      price: 4799,
      duration: "45 Hours",
      instructor: "Karthik Srinivasan",
      syllabus: ["DevOps Basics", "Docker & Containers", "Kubernetes", "CI/CD Pipelines", "Monitoring"],
      category: "Cloud",
    });
    await storage.createCourse({
      title: "Artificial Intelligence Essentials",
      description: "Understand AI concepts, neural networks, NLP and computer vision.",
      price: 5999,
      duration: "52 Hours",
      instructor: "Dr. Lakshmi Rao",
      syllabus: ["AI Fundamentals", "Deep Learning", "NLP Basics", "Computer Vision", "AI Ethics"],
      category: "Data Science",
    });
    await storage.createCourse({
      title: "Android App Development",
      description: "Build Android apps with Kotlin, Jetpack Compose and publish to Play Store.",
      price: 3799,
      duration: "44 Hours",
      instructor: "Mohammed Ismail",
      syllabus: ["Kotlin Basics", "Android Studio", "Jetpack Compose", "APIs & Firebase", "Publishing"],
      category: "Mobile Development",
    });
    await storage.createCourse({
      title: "Java Advanced - Spring Boot",
      description: "Enterprise Java development with Spring Boot, Microservices and REST APIs.",
      price: 4299,
      duration: "40 Hours",
      instructor: "Sanjay Deshmukh",
      syllabus: ["Spring Core", "Spring Boot", "REST APIs", "Microservices", "Spring Security"],
      category: "Programming",
    });
  }

  return httpServer;
}
