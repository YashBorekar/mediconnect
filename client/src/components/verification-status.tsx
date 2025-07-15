import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw } from "lucide-react";

const VerificationStatus: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery<any[]>({
    queryKey: ["/api/doctor-verifications"],
    queryFn: async () => {
      const response = await apiRequest("/api/doctor-verifications");
      return response.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const latest = requests[0];

  // Automatically refresh user data when verification status changes
  useEffect(() => {
    if (latest?.status === "approved" || latest?.status === "denied") {
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/user"],
      });
    }
  }, [latest?.status, queryClient]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/doctor-verifications", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/doctor-verifications"],
      });
    },
  });

  const refreshStatus = () => {
    refetch();
    // Also refresh user data to update the profile badge
    queryClient.invalidateQueries({
      queryKey: ["/api/auth/user"],
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Verification Status</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStatus}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      {latest ? (
        <>
          <div className="mb-2">
            Status:{" "}
            <span
              className={`font-bold ${
                latest.status === "approved"
                  ? "text-green-600"
                  : latest.status === "denied"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {latest.status}
            </span>
          </div>
          {latest.status === "approved" && (
            <div className="text-sm text-green-600">
              🎉 Congratulations! Your verification has been approved.
            </div>
          )}
          {latest.status === "denied" && (
            <div className="text-sm text-red-600">
              Your verification was denied. Please contact support.
              {latest.notes && <div>Reason: {latest.notes}</div>}
            </div>
          )}
          {latest.status === "pending" && (
            <div className="text-sm text-gray-500">
              Your verification is under review.
            </div>
          )}
        </>
      ) : (
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
        >
          Submit Verification Request
        </Button>
      )}
    </div>
  );
};

export default VerificationStatus;
