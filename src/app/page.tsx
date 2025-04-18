"use client";

import { useSession } from "next-auth/react";
import AuthButton from "@/components/AuthButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt, Tag, RefreshCcw, Sparkles, Coffee } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [logoLoaded, setLogoLoaded] = useState(true);

  // Handle logo loading error
  const handleLogoError = () => {
    setLogoLoaded(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-8 py-10">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center">
                {logoLoaded ? (
                  <Image 
                    src="/coffee-cup-logo.png" 
                    alt="Coffee Budget Logo" 
                    width={100} 
                    height={100}
                    className="object-contain"
                    onError={handleLogoError}
                    unoptimized
                  />
                ) : (
                  <Coffee className="h-16 w-16 text-blue-900" />
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center md:text-left">
                  Coffee Budget
                </h1>
                <p className="text-xl text-muted-foreground mt-2 text-center md:text-left italic">
                  "Managing your personal finances will be as simple as drinking a coffee"
                </p>
              </div>
            </div>
            
            <p className="text-lg text-gray-600">
              Track your expenses, categorize transactions, and gain insights into your spending habits 
              with our intuitive and user-friendly finance management tool.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start">
              {isLoggedIn ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <AuthButton />
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/transactions">
                      Explore Features
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 max-w-md">
              <div className="mx-auto mb-4 relative w-32 h-32 flex items-center justify-center">
                {logoLoaded ? (
                  <Image 
                    src="/coffee-cup-logo.png" 
                    alt="Coffee Budget Logo" 
                    fill
                    className="object-contain"
                    onError={handleLogoError}
                    unoptimized
                  />
                ) : (
                  <Coffee className="h-24 w-24 text-blue-900" />
                )}
              </div>
              <p className="text-blue-800 text-center italic">
                "Your finances, brewed to perfection"
              </p>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
          <Card>
            <CardHeader>
              <Receipt className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>
                Easily add, edit, and categorize your financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Record expenses and income with our intuitive interface. Organize your transactions with custom categories and tags.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Tag className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Smart Categorization</CardTitle>
              <CardDescription>
                AI-powered transaction categorization with keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our system learns from your patterns and suggests keywords to automatically categorize future transactions.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <RefreshCcw className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Recurring Transactions</CardTitle>
              <CardDescription>
                Set up and track recurring expenses and income
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage your subscriptions, bills, and regular income sources with automated recurring transaction tracking.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* AI Generated Note */}
        <Card className="border-dashed border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">AI-Generated Prototype</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              This application is a Proof of Concept entirely generated with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              This project was completely generated using Claude 3.7 Sonnet, showcasing the possibilities of AI-assisted development. 
              While there may be inconsistencies and imperfections in the code, this approach enabled rapid prototyping and idea validation.
            </p>
            <p className="mt-3 text-amber-800">
              The application demonstrates financial transaction management, categorization systems, 
              recurring transactions tracking, and data visualization - all built through AI collaboration.
            </p>
          </CardContent>
          <CardFooter className="border-t border-amber-200 bg-amber-100/50 text-amber-700 text-sm">
            Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
