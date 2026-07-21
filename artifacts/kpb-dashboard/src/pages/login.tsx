import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useVerifyPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const verifyMutation = useVerifyPassword();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;

    verifyMutation.mutate({ data: { password } }, {
      onSuccess: (result) => {
        if (result.success && result.token) {
          sessionStorage.setItem("kpb_token", result.token);
          setLocation("/leads");
        } else {
          toast({
            variant: "destructive",
            title: "Erreur d'authentification",
            description: "Mot de passe incorrect.",
          });
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Le mot de passe est incorrect ou une erreur est survenue.",
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">KPB</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Espace Équipe</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder au suivi des prospects KPB Education.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifyMutation.isPending}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyMutation.isPending || !password}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Outil interne réservé à l'équipe KPB Education
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
