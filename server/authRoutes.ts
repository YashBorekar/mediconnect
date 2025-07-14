import { Router } from "express";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import { generateToken, hashPassword, comparePassword } from "./auth";
import { z } from "zod";

const router = Router();
// Doctor profile update schema
const doctorProfileUpdateSchema = z.object({
  availableSlots: z.array(z.string()).optional(),
  specialty: z.string().optional(),
  education: z.string().optional(),
  hospital: z.string().optional(),
  experience: z.string().optional(),
  consultationFee: z.string().optional(),
  bio: z.string().optional(),
});
// PATCH doctor profile (availability, etc)
router.patch("/doctors/:id", async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    if (!doctorId)
      return res.status(400).json({ message: "Invalid doctor id" });
    const validated = doctorProfileUpdateSchema.parse(req.body);
    // Convert experience/consultationFee if present
    const updates: any = { ...validated };
    if (updates.experience) updates.experience = parseInt(updates.experience);
    if (updates.consultationFee)
      updates.consultationFee = updates.consultationFee;
    // Update profile
    const updated = await storage.updateDoctorProfile(doctorId, updates);
    res.json(updated);
  } catch (error) {
    console.error("Doctor profile update error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Profile update failed" });
  }
});

// Register schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["patient", "doctor"]).default("patient"),
  specialty: z.string().optional(),
  education: z.string().optional(),
  hospital: z.string().optional(),
  experience: z.string().optional(),
  consultationFee: z.string().optional(),
  bio: z.string().optional(),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await storage.createUser({
      id: nanoid(),
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: validatedData.role,
    });

    // If user is registering as a doctor, create a doctor profile
    if (validatedData.role === "doctor") {
      await storage.createDoctorProfile({
        userId: user.id,
        specialty: validatedData.specialty || "General Medicine",
        education: validatedData.education || "Medical Degree",
        hospital: validatedData.hospital || "Not specified",
        experience: validatedData.experience
          ? parseInt(validatedData.experience)
          : 0,
        consultationFee: validatedData.consultationFee || "100.00",
        rating: "0.00",
        reviewCount: 0,
        isVerified: false,
        isAvailable: true,
        bio: validatedData.bio || "New doctor profile",
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
