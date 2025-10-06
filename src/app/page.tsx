import { AddToHomeScreenPrompt } from "@/components/pwa/add-to-home-screen";
import { Header } from "@/components/pwa/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function Home() {
  const features = [
    "PWA Ready",
    "iOS 'Add to Home Screen' Prompt",
    "Offline Support via Service Worker",
    "Responsive for Mobile",
    "Themed with TailwindCSS"
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Welcome to your PWA Starter!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                This is a simple, responsive, and installable Progressive Web App starter. It's optimized for a native-like experience on iOS.
              </p>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <AddToHomeScreenPrompt />
    </div>
  );
}
