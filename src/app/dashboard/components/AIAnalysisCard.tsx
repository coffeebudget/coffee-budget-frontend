"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, PieChart, BarChart3, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface AIAnalysisCardProps {
  totalTransactions?: number;
  hasUncategorized?: boolean;
}

export default function AIAnalysisCard({ 
  totalTransactions = 0, 
  hasUncategorized = false 
}: AIAnalysisCardProps) {
  const router = useRouter();

  const handleAnalyzeClick = () => {
    router.push('/dashboard/ai-analysis');
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 hover:shadow-lg transition-all duration-300">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="absolute top-4 right-4">
          <Brain className="w-8 h-8 text-purple-600" />
        </div>
        <div className="absolute top-12 right-12">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
        <div className="absolute top-8 right-20">
          <PieChart className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
              Analisi Intelligente delle Spese
            </CardTitle>
          </div>
          {hasUncategorized && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Nuovi dati
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Scopri i tuoi pattern di spesa, ricevi consigli personalizzati e identifica 
          opportunità di risparmio con l'intelligenza artificiale.
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            <span>Pattern di spesa</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Trend mensili</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>Consigli AI</span>
          </div>
        </div>

        {totalTransactions > 0 && (
          <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
            <div className="text-sm text-gray-600">
              Pronto per analizzare <span className="font-medium text-purple-700">{totalTransactions}</span> transazioni
            </div>
          </div>
        )}

        <Button 
          onClick={handleAnalyzeClick}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
          size="lg"
        >
          <Brain className="w-4 h-4 mr-2" />
          Analizza le mie spese
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Powered by ChatGPT • Analisi sicura e privata
        </p>
      </CardContent>
    </Card>
  );
} 