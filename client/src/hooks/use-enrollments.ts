import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import useRazorpay, { RazorpayOptions } from "react-razorpay";
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
  const [Razorpay] = useRazorpay();
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
      // 1. Create Pending Enrollment
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

      // 2. Open Razorpay (Test Mode)
      return new Promise<void>((resolve, reject) => {
        const options: RazorpayOptions = {
          key: "rzp_test_12345678901234", // Dummy Key for Demo
          amount: amount * 100, // Amount in paise
          currency: "INR",
          name: "EduEngineer",
          description: "Course Enrollment",
          image: "https://example.com/logo.png",
          order_id: "", // In real app, create order on backend first
          handler: (response) => {
            // 3. Verify Payment
            verifyPaymentMutation.mutate({
              enrollmentId: enrollment.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || "dummy_order",
              razorpaySignature: response.razorpay_signature || "dummy_sig",
            });
            resolve();
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: "9999999999",
          },
          theme: {
            color: "#3399cc",
          },
        };

        const rzp1 = new Razorpay(options);
        rzp1.on("payment.failed", function (response: any) {
          reject(new Error(response.error.description));
        });
        rzp1.open();
      });
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
