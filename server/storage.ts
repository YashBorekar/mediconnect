import {
  users,
  doctors,
  appointments,
  healthRecords,
  symptomAnalyses,
  type User,
  type InsertUser,
  type Doctor,
  type InsertDoctor,
  type Appointment,
  type InsertAppointment,
  type HealthRecord,
  type InsertHealthRecord,
  type SymptomAnalysis,
  type InsertSymptomAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Doctor operations
  createDoctorProfile(doctor: InsertDoctor): Promise<Doctor>;
  getDoctorProfile(userId: string): Promise<Doctor | undefined>;
  getDoctorById(id: number): Promise<Doctor | undefined>;
  getAllDoctors(): Promise<Doctor[]>;
  searchDoctors(specialty?: string, availability?: string): Promise<Doctor[]>;
  updateDoctorProfile(id: number, updates: Partial<InsertDoctor>): Promise<Doctor>;

  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentById(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment>;
  cancelAppointment(id: number): Promise<void>;

  // Health record operations
  createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord>;
  getHealthRecordsByPatient(patientId: string): Promise<HealthRecord[]>;
  getHealthRecordById(id: number): Promise<HealthRecord | undefined>;
  updateHealthRecord(id: number, updates: Partial<InsertHealthRecord>): Promise<HealthRecord>;

  // Symptom analysis operations
  createSymptomAnalysis(analysis: InsertSymptomAnalysis): Promise<SymptomAnalysis>;
  getSymptomAnalysesByPatient(patientId: string): Promise<SymptomAnalysis[]>;
  getSymptomAnalysisById(id: number): Promise<SymptomAnalysis | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Add upsertUser method for compatibility
  async upsertUser(userData: InsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      return await this.updateUser(userData.id, userData);
    } else {
      return await this.createUser(userData);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Doctor operations
  async createDoctorProfile(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }

  async getDoctorProfile(userId: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor;
  }

  async getDoctorById(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.isAvailable, true));
  }

  async searchDoctors(specialty?: string, availability?: string): Promise<Doctor[]> {
    if (specialty && specialty !== "All Specialties") {
      return await db
        .select()
        .from(doctors)
        .where(and(eq(doctors.isAvailable, true), eq(doctors.specialty, specialty)));
    }
    
    return await db.select().from(doctors).where(eq(doctors.isAvailable, true));
  }

  async updateDoctorProfile(id: number, updates: Partial<InsertDoctor>): Promise<Doctor> {
    const [updatedDoctor] = await db
      .update(doctors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return updatedDoctor;
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return await db.query.appointments.findMany({
      where: eq(appointments.patientId, patientId),
      with: {
        doctor: {
          with: {
            user: true
          }
        }
      },
      orderBy: [desc(appointments.appointmentDate)]
    });
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return await db.query.appointments.findMany({
      where: eq(appointments.doctorId, doctorId),
      with: {
        patient: true
      },
      orderBy: [desc(appointments.appointmentDate)]
    });
  }

  async updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async cancelAppointment(id: number): Promise<void> {
    await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, id));
  }

  // Health record operations
  async createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord> {
    const [newRecord] = await db.insert(healthRecords).values(record).returning();
    return newRecord;
  }

  async getHealthRecordsByPatient(patientId: string): Promise<HealthRecord[]> {
    return await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.patientId, patientId))
      .orderBy(desc(healthRecords.createdAt));
  }

  async getHealthRecordById(id: number): Promise<HealthRecord | undefined> {
    const [record] = await db.select().from(healthRecords).where(eq(healthRecords.id, id));
    return record;
  }

  async updateHealthRecord(id: number, updates: Partial<InsertHealthRecord>): Promise<HealthRecord> {
    const [updatedRecord] = await db
      .update(healthRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(healthRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Symptom analysis operations
  async createSymptomAnalysis(analysis: InsertSymptomAnalysis): Promise<SymptomAnalysis> {
    const [newAnalysis] = await db.insert(symptomAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async getSymptomAnalysesByPatient(patientId: string): Promise<SymptomAnalysis[]> {
    return await db
      .select()
      .from(symptomAnalyses)
      .where(eq(symptomAnalyses.patientId, patientId))
      .orderBy(desc(symptomAnalyses.createdAt));
  }

  async getSymptomAnalysisById(id: number): Promise<SymptomAnalysis | undefined> {
    const [analysis] = await db.select().from(symptomAnalyses).where(eq(symptomAnalyses.id, id));
    return analysis;
  }
}

export const storage = new DatabaseStorage();
