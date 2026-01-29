"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Wand2 } from "lucide-react";
import { PlanTemplate } from "@/types/expense-plan-types";
import { TemplatePicker } from "../components/wizard/TemplatePicker";
import { TemplateWizard } from "../components/wizard/TemplateWizard";

type WizardMode = "select-template" | "configure-template";

export default function ExpensePlanWizardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mode, setMode] = useState<WizardMode>("select-template");
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(
    null
  );

  const handleSelectTemplate = (template: PlanTemplate) => {
    setSelectedTemplate(template);
    setMode("configure-template");
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setMode("select-template");
  };

  const handleCancel = () => {
    router.push("/expense-plans");
  };

  const handleCustomPlan = () => {
    // Navigate to custom plan creation (existing form dialog or detail page)
    router.push("/expense-plans?create=custom");
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to create expense plans.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Plans
              </Button>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Wand2 className="h-5 w-5" />
              <span className="font-semibold">Create Expense Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-8">
            {mode === "select-template" && (
              <TemplatePicker
                onSelectTemplate={handleSelectTemplate}
                onCustomPlan={handleCustomPlan}
              />
            )}

            {mode === "configure-template" && selectedTemplate && (
              <TemplateWizard
                template={selectedTemplate}
                onBack={handleBackToTemplates}
                onCancel={handleCancel}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
