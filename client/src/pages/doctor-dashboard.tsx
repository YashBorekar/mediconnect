import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import Footer from "@/components/footer";
import AppointmentCard from "@/components/appointment-card";
import { Calendar, Users, DollarSign, Clock, Settings } from "lucide-react";
import { useEffect } from "react";

export default function DoctorDashboard() {
  // Health records state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Fetch health records
  const { data: healthRecords = [], isLoading: recordsLoading } = useQuery<any[]>({
    queryKey: ["/api/health-records"],
    queryFn: async () => {
      const response = await apiRequest("/api/health-records");
      return response.json();
    },
  });

  // Create/update health record mutation
  const saveRecordMutation = useMutation({
    mutationFn: async (record: any) => {
      if (record.id) {
        const response = await apiRequest(`/api/health-records/${record.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        return response.json();
      } else {
        const response = await apiRequest("/api/health-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-records"] });
      setShowRecordModal(false);
      setEditingRecord(null);
      toast({ title: "Success", description: "Health record saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save record", variant: "destructive" });
    },
  });

  // Delete health record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/health-records/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-records"] });
      toast({ title: "Deleted", description: "Health record deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
    },
  });
  // Modal state for schedule management
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>(
    doctorProfile?.availableSlots || []
  );

  const addSlot = (slot: string) => {
    if (!availableSlots.includes(slot)) {
      setAvailableSlots([...availableSlots, slot]);
    }
  };
  const removeSlot = (slot: string) => {
    setAvailableSlots(availableSlots.filter((s) => s !== slot));
  };

  const saveSlotsMutation = useMutation({
    mutationFn: async (slots: string[]) => {
      const response = await apiRequest(`/api/doctors/${doctorProfile?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableSlots: slots }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Availability updated" });
      setShowScheduleModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    },
  });
  // Modal state for editing profile
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(doctorProfile || {});

  const specialties = [
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedist",
    "Psychiatrist",
    "Radiologist",
    "Surgeon",
    "Urologist",
    "General Physician",
    "Endocrinologist",
    "Gastroenterologist",
    "Oncologist",
    "Neurologist",
    "Dentist",
    "ENT Specialist",
    "Ophthalmologist",
    "Other",
  ];

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/doctors/${doctorProfile?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setShowEditModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For demo mode: don't redirect if not authenticated
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     toast({
  //       title: "Unauthorized",
  //       description: "You are logged out. Logging in again...",
  //       variant: "destructive",
  //     });
  //     setTimeout(() => {
  //       window.location.href = "/api/login";
  //     }, 500);
  //     return;
  //   }
  // }, [isAuthenticated, isLoading, toast]);

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: true, // Always load appointments for demo mode
    queryFn: async () => {
      const response = await apiRequest("/api/appointments");
      return response.json();
    },
  });

  const joinCallMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      setActiveCallId(appointmentId);
    },
  // State for active video call
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join call",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  // Create doctor profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("/api/doctors/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Doctor profile created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create doctor profile",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if doctor profile exists
  const doctorProfile = (user as any)?.doctorProfile;
  const hasProfile = !!doctorProfile;

  // If doctor doesn't have a profile, show profile creation form
  if (isAuthenticated && user?.role === "doctor" && !hasProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Doctor Profile</CardTitle>
              <p className="text-gray-600">
                Please complete your profile to start appearing in doctor
                searches and receiving appointments.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => createProfileMutation.mutate({})}
                disabled={createProfileMutation.isPending}
                className="w-full"
              >
                {createProfileMutation.isPending
                  ? "Creating Profile..."
                  : "Create Doctor Profile"}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const todayAppointments = (appointments as any[]).filter((apt: any) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const upcomingAppointments = (appointments as any[]).filter(
    (apt: any) =>
      new Date(apt.appointmentDate) > new Date() && apt.status === "scheduled"
  );

  const completedAppointments = (appointments as any[]).filter(
    (apt: any) => apt.status === "completed"
  );

  const totalRevenue = completedAppointments.reduce(
    (sum: number, apt: any) => sum + parseFloat(apt.consultationFee || "0"),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Edit Profile Modal */}
      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Manage Availability</h2>
            <div className="space-y-2 mb-4">
              <label className="block font-medium mb-2">
                Add Available Time Slot (e.g. 2025-07-15T09:00)
              </label>
              <input
                type="datetime-local"
                className="w-full border rounded p-2"
                onChange={(e) => addSlot(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Current Available Slots</h3>
              <ul className="space-y-1">
                {availableSlots.map((slot) => (
                  <li key={slot} className="flex items-center justify-between">
                    <span>{slot}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSlot(slot)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                className="flex-1"
                onClick={() => saveSlotsMutation.mutate(availableSlots)}
                disabled={saveSlotsMutation.isPending}
              >
                {saveSlotsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate(editData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 font-medium">Specialty</label>
                <select
                  className="w-full border rounded p-2"
                  value={editData.specialty || ""}
                  onChange={(e) =>
                    setEditData((d: any) => ({
                      ...d,
                      specialty: e.target.value,
                    }))
                  }
                >
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Education</label>
                <input
                  className="w-full border rounded p-2"
                  value={editData.education || ""}
                  onChange={(e) =>
                    setEditData((d: any) => ({
                      ...d,
                      education: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Hospital/Clinic
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={editData.hospital || ""}
                  onChange={(e) =>
                    setEditData((d: any) => ({
                      ...d,
                      hospital: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded p-2"
                  value={editData.experience || ""}
                  onChange={(e) =>
                    setEditData((d: any) => ({
                      ...d,
                      experience: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Consultation Fee (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded p-2"
                  value={editData.consultationFee || ""}
                  onChange={(e) =>
                    setEditData((d: any) => ({
                      ...d,
                      consultationFee: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Bio/Description
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={editData.bio || ""}
                  onChange={(e) =>
                    setEditData((d: any) => ({ ...d, bio: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage
                    src={user?.profileImageUrl || ""}
                    alt="Profile"
                  />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dr. {user?.firstName || ""} {user?.lastName || ""}
                  </h1>
                  <p className="text-gray-600">
                    {(user as any)?.doctorProfile?.specialty ||
                      "Healthcare Professional"}
                  </p>
                  <div className="flex items-center mt-1">
                    <Badge variant="secondary" className="mr-2">
                      {(user as any)?.doctorProfile?.isVerified
                        ? "Verified"
                        : "Pending Verification"}
                    </Badge>
                    <Badge
                      variant={
                        (user as any)?.doctorProfile?.isAvailable
                          ? "default"
                          : "secondary"
                      }
                    >
                      {(user as any)?.doctorProfile?.isAvailable
                        ? "Available"
                        : "Offline"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </Button>
              <Button
                variant="outline"
                className="ml-2"
                onClick={() => {
                  setEditData(doctorProfile);
                  setShowEditModal(true);
                }}
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today's Appointments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayAppointments.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Patients
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedAppointments.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Rating
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(user as any)?.doctorProfile?.rating || "N/A"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment: any) => (
    <div key={appointment.id}>
      <AppointmentCard
        appointment={appointment}
        userRole="doctor"
        onJoinCall={(id) => joinCallMutation.mutate(id)}
      />
      {activeCallId === appointment.id && (
        <div className="my-4">
          <VideoCall roomId={`appointment-${appointment.id}`} userRole="doctor" />
        </div>
      )}
    </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No appointments today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments
    .slice(0, 5)
    .map((appointment: any) => (
      <div key={appointment.id}>
        <AppointmentCard
          appointment={appointment}
          userRole="doctor"
          onJoinCall={(id) => joinCallMutation.mutate(id)}
        />
        {activeCallId === appointment.id && (
          <div className="my-4">
            <VideoCall roomId={`appointment-${appointment.id}`} userRole="doctor" />
          </div>
        )}
      </div>
    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No upcoming appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
            {/* Secure Messaging */}
            <Card>
              <CardHeader>
                <CardTitle>Secure Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                {/* For demo: chat with first patient from upcoming appointments */}
                {upcomingAppointments.length > 0 ? (
                  <Chat receiverId={upcomingAppointments[0].patientId} appointmentId={upcomingAppointments[0].id} />
                ) : (
                  <div>No patients to message.</div>
                )}
              </CardContent>
            </Card>
            {/* Health Records */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Health Records</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => { setEditingRecord(null); setShowRecordModal(true); }}>
                    Add Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recordsLoading ? (
                  <div>Loading...</div>
                ) : healthRecords.length > 0 ? (
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2">Type</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Patient</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthRecords.map((rec) => (
                        <tr key={rec.id} className="border-t">
                          <td className="p-2">{rec.recordType}</td>
                          <td className="p-2">{rec.title}</td>
                          <td className="p-2">{rec.patientId || "-"}</td>
                          <td className="p-2">{rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "-"}</td>
                          <td className="p-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditingRecord(rec); setShowRecordModal(true); }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteRecordMutation.mutate(rec.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div>No health records found.</div>
                )}
              </CardContent>
            </Card>

            {/* Health Record Modal */}
            {showRecordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
                  <h2 className="text-xl font-bold mb-4">{editingRecord ? "Edit" : "Add"} Health Record</h2>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const record = {
                        id: editingRecord?.id,
                        recordType: formData.get("recordType"),
                        title: formData.get("title"),
                        description: formData.get("description"),
                        isPrivate: formData.get("isPrivate") === "on",
                      };
                      saveRecordMutation.mutate(record);
                    }}
                  >
                    <div className="mb-4">
                      <label className="block font-medium mb-1">Type</label>
                      <input name="recordType" defaultValue={editingRecord?.recordType || "exam"} className="w-full border rounded p-2" required />
                    </div>
                    <div className="mb-4">
                      <label className="block font-medium mb-1">Title</label>
                      <input name="title" defaultValue={editingRecord?.title || ""} className="w-full border rounded p-2" required />
                    </div>
                    <div className="mb-4">
                      <label className="block font-medium mb-1">Description</label>
                      <textarea name="description" defaultValue={editingRecord?.description || ""} className="w-full border rounded p-2" />
                    </div>
                    <div className="mb-4 flex items-center gap-2">
                      <input type="checkbox" name="isPrivate" defaultChecked={editingRecord?.isPrivate} />
                      <label>Private</label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button type="submit" className="flex-1" disabled={saveRecordMutation.isPending}>
                        {saveRecordMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowRecordModal(false); setEditingRecord(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          <div className="space-y-6">
            {/* Schedule Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available Hours</span>
                  <span className="font-medium">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="font-medium">
                    ${(user as any)?.doctorProfile?.consultationFee || "75"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">
                    {(user as any)?.doctorProfile?.experience || "5"} years
                  </span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Update Availability
                </Button>
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => setShowScheduleModal(true)}
                >
                  Manage Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-3 h-4 w-4" />
                  Block Time Slot
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-3 h-4 w-4" />
                  View Patient Records
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-3 h-4 w-4" />
                  Revenue Report
                </Button>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Appointments</span>
                  <span className="font-medium text-primary">
                    {(appointments as any[]).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium text-medical-green">
                    ${totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-medium text-yellow-600">
                    ⭐ {(user as any)?.doctorProfile?.rating || "4.9"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
