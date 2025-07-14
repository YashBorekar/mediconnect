import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/header";
import Footer from "@/components/footer";
import AppointmentCard from "@/components/appointment-card";
import { Link } from "wouter";
import {
  Plus,
  FileText,
  Stethoscope,
  MessageSquare,
  Activity,
} from "lucide-react";
import { useEffect } from "react";

export default function PatientDashboard() {
  // Prescriptions state
  const { data: prescriptions = [], isLoading: prescriptionsLoading } =
    useQuery<any[]>({
      queryKey: ["/api/prescriptions"],
      queryFn: async () => {
        const response = await apiRequest("/api/prescriptions");
        return response.json();
      },
    });

  const requestRefillMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/prescriptions/${id}/refill`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Requested", description: "Refill request sent" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to request refill",
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
  });

  const { data: healthRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/health-records"],
    enabled: true, // Always load health records for demo mode
  });

  const joinCallMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      // Mock video call functionality
      toast({
        title: "Joining Call",
        description: "Connecting to video consultation...",
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
        description: "Failed to join call",
        variant: "destructive",
      });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      await apiRequest("DELETE", `/api/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
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
        description: "Failed to cancel appointment",
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

  const upcomingAppointments = appointments.filter(
    (apt: any) =>
      new Date(apt.appointmentDate) > new Date() && apt.status === "scheduled"
  );

  const recentRecords = healthRecords.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.firstName || "there"}
                  </h1>
                  <p className="text-gray-600">
                    Manage your health and appointments
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/find-doctors">
                  <Plus className="mr-2 h-4 w-4" />
                  Book New Appointment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment: any) => (
                      <div key={appointment.id}>
                        <AppointmentCard
                          appointment={appointment}
                          userRole="patient"
                          onJoinCall={(id) => joinCallMutation.mutate(id)}
                          onCancel={(id) =>
                            cancelAppointmentMutation.mutate(id)
                          }
                        />
                        {activeCallId === appointment.id && (
                          <div className="my-4">
                            <VideoCall
                              roomId={`appointment-${appointment.id}`}
                              userRole="patient"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No upcoming appointments
                    </p>
                    <Button asChild>
                      <Link href="/find-doctors">
                        Book Your First Appointment
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Health Records */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Health Records</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRecord(null);
                      setShowRecordModal(true);
                    }}
                  >
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
                        <th className="p-2">Doctor</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthRecords.map((rec) => (
                        <tr key={rec.id} className="border-t">
                          <td className="p-2">{rec.recordType}</td>
                          <td className="p-2">{rec.title}</td>
                          <td className="p-2">{rec.doctorId || "-"}</td>
                          <td className="p-2">
                            {rec.createdAt
                              ? new Date(rec.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="p-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRecord(rec);
                                setShowRecordModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteRecordMutation.mutate(rec.id)
                              }
                            >
                              Delete
                            </Button>
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
                  <h2 className="text-xl font-bold mb-4">
                    {editingRecord ? "Edit" : "Add"} Health Record
                  </h2>
                  <form
                    onSubmit={(e) => {
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
                      <input
                        name="recordType"
                        defaultValue={editingRecord?.recordType || "exam"}
                        className="w-full border rounded p-2"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block font-medium mb-1">Title</label>
                      <input
                        name="title"
                        defaultValue={editingRecord?.title || ""}
                        className="w-full border rounded p-2"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingRecord?.description || ""}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div className="mb-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isPrivate"
                        defaultChecked={editingRecord?.isPrivate}
                      />
                      <label>Private</label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={saveRecordMutation.isPending}
                      >
                        {saveRecordMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowRecordModal(false);
                          setEditingRecord(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptionsLoading ? (
                <div>Loading...</div>
              ) : prescriptions.length > 0 ? (
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2">Medication</th>
                      <th className="p-2">Doctor</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx) => (
                      <tr key={rx.id} className="border-t">
                        <td className="p-2">{rx.medication}</td>
                        <td className="p-2">{rx.doctorId}</td>
                        <td className="p-2">
                          {rx.refillRequested
                            ? "Refill Requested"
                            : rx.refillApproved
                            ? "Refill Approved"
                            : "Active"}
                        </td>
                        <td className="p-2">
                          {!rx.refillRequested && !rx.refillApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                requestRefillMutation.mutate(rx.id)
                              }
                            >
                              Request Refill
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>No prescriptions found.</div>
              )}
            </CardContent>
          </Card>
          {/* Secure Messaging */}
          <Card>
            <CardHeader>
              <CardTitle>Secure Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              {/* For demo: chat with first doctor from upcoming appointments */}
              {upcomingAppointments.length > 0 ? (
                <Chat
                  receiverId={upcomingAppointments[0].doctorId}
                  appointmentId={upcomingAppointments[0].id}
                />
              ) : (
                <div>No doctors to message.</div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/symptom-checker">
                    <Stethoscope className="mr-3 h-4 w-4" />
                    Check Symptoms
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-3 h-4 w-4" />
                  Refill Prescription
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-3 h-4 w-4" />
                  Message Doctor
                </Button>
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Health Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Blood Pressure</span>
                  <span className="font-medium text-medical-green">120/80</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Heart Rate</span>
                  <span className="font-medium text-medical-green">72 bpm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Weight</span>
                  <span className="font-medium">150 lbs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">BMI</span>
                  <span className="font-medium text-medical-green">22.5</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Activity className="mr-2 h-4 w-4" />
                  View Full Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
