import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  authenticateToken,
  optionalAuth,
  type AuthenticatedRequest,
} from "./auth";
import authRoutes from "./authRoutes";
import { SymptomAnalysisService } from "./services/symptomAnalysis";
import {
  insertDoctorSchema,
  insertAppointmentSchema,
  insertHealthRecordSchema,
  insertSymptomAnalysisSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Messaging CRUD
  app.post(
    "/api/messages",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { receiverId, appointmentId, content } = req.body;
        if (!receiverId || !content)
          return res.status(400).json({ message: "Missing fields" });
        const message = await storage.createMessage({
          senderId: req.userId,
          receiverId,
          appointmentId,
          content,
        });
        res.status(201).json(message);
      } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  );

  app.get(
    "/api/messages",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { appointmentId, withUser } = req.query;
        const messages = await storage.getMessages({
          userId: req.userId,
          appointmentId,
          withUser,
        });
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    }
  );
  // Health Records CRUD
  app.post(
    "/api/health-records",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordData = insertHealthRecordSchema.parse({
          ...req.body,
          patientId: req.userId,
        });
        const record = await storage.createHealthRecord(recordData);
        res.status(201).json(record);
      } catch (error) {
        console.error("Error creating health record:", error);
        res.status(500).json({ message: "Failed to create health record" });
      }
    }
  );

  app.get(
    "/api/health-records",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user;
        let records: any[] = [];
        if (user?.role === "doctor") {
          const doctorProfile = await storage.getDoctorProfile(req.userId!);
          if (doctorProfile) {
            records = await storage.getHealthRecordsByDoctor(doctorProfile.id);
          }
        } else {
          records = await storage.getHealthRecordsByPatient(req.userId!);
        }
        res.json(records);
      } catch (error) {
        console.error("Error fetching health records:", error);
        res.status(500).json({ message: "Failed to fetch health records" });
      }
    }
  );

  app.get(
    "/api/health-records/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordId = parseInt(req.params.id);
        const record = await storage.getHealthRecordById(recordId);
        if (!record)
          return res.status(404).json({ message: "Health record not found" });
        res.json(record);
      } catch (error) {
        console.error("Error fetching health record:", error);
        res.status(500).json({ message: "Failed to fetch health record" });
      }
    }
  );

  app.patch(
    "/api/health-records/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordId = parseInt(req.params.id);
        const updates = insertHealthRecordSchema.partial().parse(req.body);
        const record = await storage.updateHealthRecord(recordId, updates);
        res.json(record);
      } catch (error) {
        console.error("Error updating health record:", error);
        res.status(500).json({ message: "Failed to update health record" });
      }
    }
  );

  app.delete(
    "/api/health-records/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordId = parseInt(req.params.id);
        await storage.deleteHealthRecord(recordId);
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting health record:", error);
        res.status(500).json({ message: "Failed to delete health record" });
      }
    }
  );
  // Auth routes
  app.use("/api/auth", authRoutes);

  // Get current user
  app.get(
    "/api/auth/user",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user;
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // If user is a doctor, include doctor profile
        if (user.role === "doctor") {
          const doctorProfile = await storage.getDoctorProfile(user.id);
          res.json({
            ...userWithoutPassword,
            doctorProfile,
          });
        } else {
          res.json(userWithoutPassword);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  );

  // Doctor routes
  app.post(
    "/api/doctors",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const doctorData = insertDoctorSchema.parse({
          ...req.body,
          userId: req.userId,
        });
        const doctor = await storage.createDoctorProfile(doctorData);
        res.status(201).json(doctor);
      } catch (error) {
        console.error("Error creating doctor profile:", error);
        res.status(500).json({ message: "Failed to create doctor profile" });
      }
    }
  );

  app.get(
    "/api/doctors",
    optionalAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { specialty, availability } = req.query;
        const doctors = await storage.searchDoctors(
          specialty as string,
          availability as string
        );
        res.json(doctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ message: "Failed to fetch doctors" });
      }
    }
  );

  app.get(
    "/api/doctors/:id",
    optionalAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const doctorId = parseInt(req.params.id);
        const doctor = await storage.getDoctorById(doctorId);
        if (!doctor) {
          return res.status(404).json({ message: "Doctor not found" });
        }
        res.json(doctor);
      } catch (error) {
        console.error("Error fetching doctor:", error);
        res.status(500).json({ message: "Failed to fetch doctor" });
      }
    }
  );

  app.get(
    "/api/doctors/profile/:userId",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const doctor = await storage.getDoctorProfile(req.params.userId);
        if (!doctor) {
          return res.status(404).json({ message: "Doctor profile not found" });
        }
        res.json(doctor);
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        res.status(500).json({ message: "Failed to fetch doctor profile" });
      }
    }
  );

  app.patch(
    "/api/doctors/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const doctorId = parseInt(req.params.id);
        const updates = insertDoctorSchema.partial().parse(req.body);
        const doctor = await storage.updateDoctorProfile(doctorId, updates);
        res.json(doctor);
      } catch (error) {
        console.error("Error updating doctor profile:", error);
        res.status(500).json({ message: "Failed to update doctor profile" });
      }
    }
  );

  // Create doctor profile for existing doctor users
  app.post(
    "/api/doctors/create-profile",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user;
        if (!user || user.role !== "doctor") {
          return res.status(403).json({
            message: "Access denied. Only doctors can create profiles.",
          });
        }

        // Check if profile already exists
        const existingProfile = await storage.getDoctorProfile(user.id);
        if (existingProfile) {
          return res
            .status(400)
            .json({ message: "Doctor profile already exists" });
        }

        // Create default doctor profile
        const doctorProfile = await storage.createDoctorProfile({
          userId: user.id,
          specialty: req.body.specialty || "General Medicine",
          education: req.body.education || "Medical Degree",
          hospital: req.body.hospital || "Not specified",
          experience: req.body.experience || 0,
          consultationFee: req.body.consultationFee || "100.00",
          rating: "0.00",
          reviewCount: 0,
          isVerified: false,
          isAvailable: true,
          bio: req.body.bio || "New doctor profile",
        });

        res.status(201).json(doctorProfile);
      } catch (error) {
        console.error("Error creating doctor profile:", error);
        res.status(500).json({ message: "Failed to create doctor profile" });
      }
    }
  );

  // Appointment routes
  app.post(
    "/api/appointments",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const appointmentData = insertAppointmentSchema.parse({
          ...req.body,
          patientId: req.userId,
          appointmentDate: new Date(req.body.appointmentDate),
        });
        const appointment = await storage.createAppointment(appointmentData);
        res.status(201).json(appointment);
      } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Failed to create appointment" });
      }
    }
  );

  app.get(
    "/api/appointments",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user;
        let appointments: any[] = [];

        if (user?.role === "doctor") {
          const doctorProfile = await storage.getDoctorProfile(req.userId!);
          if (doctorProfile) {
            appointments = await storage.getAppointmentsByDoctor(
              doctorProfile.id
            );
          }
        } else {
          appointments = await storage.getAppointmentsByPatient(req.userId!);
        }

        res.json(appointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ message: "Failed to fetch appointments" });
      }
    }
  );

  app.get(
    "/api/appointments/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const appointmentId = parseInt(req.params.id);
        const appointment = await storage.getAppointmentById(appointmentId);
        if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
        }
        res.json(appointment);
      } catch (error) {
        console.error("Error fetching appointment:", error);
        res.status(500).json({ message: "Failed to fetch appointment" });
      }
    }
  );

  app.patch(
    "/api/appointments/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const appointmentId = parseInt(req.params.id);
        const updates = insertAppointmentSchema.partial().parse(req.body);
        const appointment = await storage.updateAppointment(
          appointmentId,
          updates
        );
        res.json(appointment);
      } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ message: "Failed to update appointment" });
      }
    }
  );

  app.delete(
    "/api/appointments/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const appointmentId = parseInt(req.params.id);
        await storage.cancelAppointment(appointmentId);
        res.status(204).send();
      } catch (error) {
        console.error("Error canceling appointment:", error);
        res.status(500).json({ message: "Failed to cancel appointment" });
      }
    }
  );

  // Health Records routes
  app.post(
    "/api/health-records",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const healthRecordData = insertHealthRecordSchema.parse({
          ...req.body,
          patientId: req.userId,
        });
        const healthRecord = await storage.createHealthRecord(healthRecordData);
        res.status(201).json(healthRecord);
      } catch (error) {
        console.error("Error creating health record:", error);
        res.status(500).json({ message: "Failed to create health record" });
      }
    }
  );

  app.get(
    "/api/health-records",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const healthRecords = await storage.getHealthRecordsByPatient(
          req.userId!
        );
        res.json(healthRecords);
      } catch (error) {
        console.error("Error fetching health records:", error);
        res.status(500).json({ message: "Failed to fetch health records" });
      }
    }
  );

  app.get(
    "/api/health-records/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordId = parseInt(req.params.id);
        const healthRecord = await storage.getHealthRecordById(recordId);
        if (!healthRecord) {
          return res.status(404).json({ message: "Health record not found" });
        }
        res.json(healthRecord);
      } catch (error) {
        console.error("Error fetching health record:", error);
        res.status(500).json({ message: "Failed to fetch health record" });
      }
    }
  );

  app.patch(
    "/api/health-records/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordId = parseInt(req.params.id);
        const updates = insertHealthRecordSchema.partial().parse(req.body);
        const healthRecord = await storage.updateHealthRecord(
          recordId,
          updates
        );
        res.json(healthRecord);
      } catch (error) {
        console.error("Error updating health record:", error);
        res.status(500).json({ message: "Failed to update health record" });
      }
    }
  );

  // Symptom Analysis routes
  app.post(
    "/api/symptom-analysis",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { symptoms, age, gender } = req.body;

        if (!symptoms) {
          return res.status(400).json({ message: "Symptoms are required" });
        }

        // Use the symptom analysis service
        const symptomAnalysisService = new SymptomAnalysisService();
        const analysis = await symptomAnalysisService.analyzeSymptoms({
          symptoms,
          age: age || "26-35",
          gender: gender || "male",
        });

        const symptomAnalysisData = insertSymptomAnalysisSchema.parse({
          patientId: req.userId,
          symptoms,
          age: age || "26-35",
          gender: gender || "male",
          analysis: analysis,
          recommendations: analysis.recommendations.join("; "),
        });

        const symptomAnalysis = await storage.createSymptomAnalysis(
          symptomAnalysisData
        );
        res.status(201).json(symptomAnalysis);
      } catch (error) {
        console.error("Error creating symptom analysis:", error);
        res.status(500).json({ message: "Failed to create symptom analysis" });
      }
    }
  );

  app.get(
    "/api/symptom-analysis",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const symptomAnalyses = await storage.getSymptomAnalysesByPatient(
          req.userId!
        );
        res.json(symptomAnalyses);
      } catch (error) {
        console.error("Error fetching symptom analyses:", error);
        res.status(500).json({ message: "Failed to fetch symptom analyses" });
      }
    }
  );

  app.get(
    "/api/symptom-analysis/:id",
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const analysisId = parseInt(req.params.id);
        const symptomAnalysis = await storage.getSymptomAnalysisById(
          analysisId
        );
        if (!symptomAnalysis) {
          return res
            .status(404)
            .json({ message: "Symptom analysis not found" });
        }
        res.json(symptomAnalysis);
      } catch (error) {
        console.error("Error fetching symptom analysis:", error);
        res.status(500).json({ message: "Failed to fetch symptom analysis" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
