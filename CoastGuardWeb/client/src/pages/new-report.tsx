import { useLocation } from "wouter";
import { NewReportForm } from "@/components/new-report-form";

export default function NewReportPage() {
  const [, setLocation] = useLocation();

  function handleSuccess() {
    setLocation("/my-reports");
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <NewReportForm onSuccess={handleSuccess} />
    </div>
  );
}
