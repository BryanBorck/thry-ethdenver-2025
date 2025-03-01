"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAsyncCall = async () => {
    try {
      setIsLoading(true);
      // Simulate an API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // You can replace this with your actual async function call
      const response = await fetch("/api/test", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      toast.success("Async operation completed successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Test Page</h1>
        <p className="text-muted-foreground">
          Click the button below to trigger an async function
        </p>
        <Button
          onClick={handleAsyncCall}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Processing..." : "Test Async Function"}
        </Button>
      </div>
    </div>
  );
}
