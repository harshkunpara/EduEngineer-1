import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

export function useEnrollments() {
  return useQuery({
    queryKey: [api.enrollments.list.path],
    queryFn: async () => {
      const res = await fetch(api.enrollments.list.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      return api.enrollments.list.responses[200].parse(await res.json());
    },
  });
}

export function useEnrollAndPay() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const verifyPaymentMutation = useMutation({
    mutationFn: async (data: {
      enrollmentId: number;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    }) => {
      const res = await fetch(api.enrollments.verifyPayment.path, {
        method: api.enrollments.verifyPayment.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Payment verification failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      toast({
        title: "Enrollment Successful!",
        description: "Welcome to the course. Start learning now!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return useMutation({
    mutationFn: async ({ courseId, amount }: { courseId: number; amount: number }) => {
      const res = await fetch(api.enrollments.create.path, {
        method: api.enrollments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please log in to enroll");
        throw new Error("Failed to initialize enrollment");
      }
      
      const enrollment = api.enrollments.create.responses[201].parse(await res.json());

      // Demo: Simulate payment with confirmation dialog
      const confirmed = window.confirm(
        `Demo Payment: ₹${amount.toLocaleString("en-IN")}\n\nThis is a test mode simulation.\nClick OK to simulate successful payment.`
      );

      if (confirmed) {
        await verifyPaymentMutation.mutateAsync({
          enrollmentId: enrollment.id,
          razorpayPaymentId: `pay_demo_${Date.now()}`,
          razorpayOrderId: `order_demo_${Date.now()}`,
          razorpaySignature: `sig_demo_${Date.now()}`,
        });
      } else {
        throw new Error("Payment cancelled by user");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
