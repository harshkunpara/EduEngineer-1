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

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
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
      description: "Master Python and libraries like NumPy, Pandas, and Matplotlib.",
      price: 3499,
      duration: "35 Hours",
      instructor: "Rahul Verma",
      syllabus: ["Python Basics", "Data Structures", "NumPy & Pandas", "Data Visualization", "Mini Project"],
      category: "Data Science",
    });
    await storage.createCourse({
      title: "Web Development Bootcamp",
      description: "Become a Full Stack Developer with MERN Stack.",
      price: 4999,
      duration: "60 Hours",
      instructor: "Sandeep Singh",
      syllabus: ["HTML/CSS/JS", "React.js", "Node.js & Express", "MongoDB", "Deployment"],
      category: "Web Development",
    });
    await storage.createCourse({
      title: "Data Structures & Algorithms",
      description: "Ace your coding interviews with DSA in C++.",
      price: 3999,
      duration: "50 Hours",
      instructor: "Amit Patel",
      syllabus: ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Greedy Algorithms"],
      category: "Computer Science",
    });
  }

  return httpServer;
}
