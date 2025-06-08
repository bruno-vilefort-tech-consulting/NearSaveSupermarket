import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { Leaf, Mail, Lock, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";

type LoginFormData = {
  email: string;
  password: string;
};

export default function CustomerLogin() {
  const [, navigate] = useLocation();
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const loginSchema = z.object({
    email: z.string().email(t('auth.emailRequired')),
    password: z.string().min(6, t('auth.passwordMinLength')),
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      setErrorMessage(""); // Limpar erro anterior
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('customerInfo', JSON.stringify(data));
      setErrorMessage(""); // Limpar qualquer erro
      navigate("/home");
    },
    onError: (error: any) => {
      let errorMsg = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
      
      // Verificar se é erro de credenciais inválidas
      if (error.message && error.message.includes('401')) {
        errorMsg = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
      } else if (error.message && error.message.includes('404')) {
        errorMsg = "Usuário não encontrado. Verifique seu email ou registre-se.";
      } else if (error.message && error.message.includes('400')) {
        errorMsg = "Dados inválidos. Verifique os campos preenchidos.";
      }
      
      setErrorMessage(errorMsg);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-eco-gray-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-eco-gray-dark">{t('landing.title')}</h1>
          <div className="flex justify-center mt-2">
            <span className="text-eco-orange text-[10px] font-bold">By Up Brasil</span>
          </div>
        </div>

        <Card className="shadow-lg border-eco-green-light bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-semibold text-eco-gray-dark">
              {t('auth.login')}
            </CardTitle>
            <p className="text-sm text-eco-gray">
              Acesse sua conta para economizar e ajudar o meio ambiente
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-eco-gray-dark">{t('auth.email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            type="email"
                            placeholder={t('auth.email')}
                            className="pl-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-eco-gray-dark">{t('auth.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.password')}
                            className="pl-10 pr-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 h-4 w-4 text-eco-gray hover:text-eco-gray-dark transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-eco-blue hover:text-eco-blue-dark font-medium transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-3 rounded-xl transition-colors"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            </Form>

            <Separator className="bg-eco-gray-light" />

            <div className="text-center space-y-4">
              <p className="text-sm text-eco-gray">
                {t('auth.dontHaveAccount')}
              </p>
              <Button
                variant="outline"
                className="w-full border-eco-blue text-eco-blue hover:bg-eco-blue-light hover:text-eco-blue-dark font-semibold py-3 rounded-xl transition-colors"
                onClick={() => navigate("/register")}
              >
                {t('customer.register')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voltar */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center space-x-2 text-eco-gray hover:text-eco-gray-dark transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{t('common.backToHome')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}