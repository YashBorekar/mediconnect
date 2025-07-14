import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

const VerificationStatus: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor-verifications"],
    queryFn: async () => {
      const response = await apiRequest("/api/doctor-verifications");
      return response.json();
    },
  });

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

  if (isLoading) return <div>Loading...</div>;
  const latest = requests[0];
  return (
    <div>
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
          {latest.status === "pending" && (
            <div className="text-sm text-gray-500">
              Your verification is under review.
            </div>
          )}
          {latest.status === "denied" && (
            <div className="text-sm text-red-500">Denied: {latest.notes}</div>
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
