import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "patient" as "patient" | "doctor",
    specialty: "",
    education: "",
    hospital: "",
    experience: "",
    consultationFee: "",
    bio: "",
  });

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const validatePassword = (password: string) => {
    const validation = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Authentication failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("token", data.token);

      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Success",
        description: isLogin
          ? "Logged in successfully!"
          : "Account created successfully!",
      });

      // Redirect to dashboard
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength for registration
    if (!isLogin && !validatePassword(formData.password)) {
      toast({
        title: "Password requirements not met",
        description: "Please ensure your password meets all requirements",
        variant: "destructive",
      });
      return;
    }

    authMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            MediConnect
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Login" : "Sign Up"}
            </CardTitle>
            <p className="text-center text-sm text-gray-600">
              Use your email and password to access your account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => {
                    handleInputChange("password", e.target.value);
                    if (!isLogin) {
                      validatePassword(e.target.value);
                    }
                  }}
                  placeholder="Enter your password"
                />
                {!isLogin && formData.password && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium mb-1">Password Requirements:</p>
                    <div className="space-y-1">
                      <div
                        className={`flex items-center ${
                          passwordValidation.length
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span className="mr-1">
                          {passwordValidation.length ? "✓" : "✗"}
                        </span>
                        At least 8 characters
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordValidation.lowercase
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span className="mr-1">
                          {passwordValidation.lowercase ? "✓" : "✗"}
                        </span>
                        One lowercase letter
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordValidation.uppercase
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span className="mr-1">
                          {passwordValidation.uppercase ? "✓" : "✗"}
                        </span>
                        One uppercase letter
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordValidation.number
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span className="mr-1">
                          {passwordValidation.number ? "✓" : "✗"}
                        </span>
                        One number
                      </div>
                      <div
                        className={`flex items-center ${
                          passwordValidation.special
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span className="mr-1">
                          {passwordValidation.special ? "✓" : "✗"}
                        </span>
                        One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        handleInputChange("role", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === "doctor" && (
                    <>
                      <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        <Select
                          value={formData.specialty}
                          onValueChange={(value) =>
                            handleInputChange("specialty", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialties.map((spec) => (
                              <SelectItem key={spec} value={spec}>
                                {spec}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="education">Education</Label>
                        <Input
                          id="education"
                          required
                          value={formData.education}
                          onChange={(e) =>
                            handleInputChange("education", e.target.value)
                          }
                          placeholder="e.g. MBBS, MD, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="hospital">Hospital/Clinic</Label>
                        <Input
                          id="hospital"
                          required
                          value={formData.hospital}
                          onChange={(e) =>
                            handleInputChange("hospital", e.target.value)
                          }
                          placeholder="e.g. Apollo Hospital"
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          min={0}
                          required
                          value={formData.experience}
                          onChange={(e) =>
                            handleInputChange("experience", e.target.value)
                          }
                          placeholder="e.g. 5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="consultationFee">
                          Consultation Fee (USD)
                        </Label>
                        <Input
                          id="consultationFee"
                          type="number"
                          min={0}
                          required
                          value={formData.consultationFee}
                          onChange={(e) =>
                            handleInputChange("consultationFee", e.target.value)
                          }
                          placeholder="e.g. 100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio/Description</Label>
                        <Input
                          id="bio"
                          required
                          value={formData.bio}
                          onChange={(e) =>
                            handleInputChange("bio", e.target.value)
                          }
                          placeholder="Short description about yourself"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending
                  ? "Loading..."
                  : isLogin
                  ? "Sign In"
                  : "Sign Up"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
