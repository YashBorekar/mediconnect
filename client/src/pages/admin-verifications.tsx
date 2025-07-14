import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

const AdminVerifications: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor-verifications"],
    queryFn: async () => {
      const response = await apiRequest("/api/doctor-verifications");
      return response.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: number;
      status: string;
      notes?: string;
    }) => {
      await apiRequest(`/api/doctor-verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/doctor-verifications"],
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Doctor Verification Requests</h1>
      <table className="w-full text-sm border mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Doctor ID</th>
            <th className="p-2">Status</th>
            <th className="p-2">Submitted</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="border-t">
              <td className="p-2">{req.doctorId}</td>
              <td className="p-2">{req.status}</td>
              <td className="p-2">
                {req.submittedAt
                  ? new Date(req.submittedAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="p-2 flex gap-2">
                {req.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        reviewMutation.mutate({
                          id: req.id,
                          status: "approved",
                        })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        reviewMutation.mutate({
                          id: req.id,
                          status: "denied",
                          notes: "Insufficient documents",
                        })
                      }
                    >
                      Deny
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminVerifications;
