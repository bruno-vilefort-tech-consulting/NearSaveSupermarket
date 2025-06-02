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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { Leaf, Mail, Lock, ArrowLeft } from "lucide-react";

type LoginFormData = {
  email: string;
  password: string;
};

export default function CustomerLogin() {
  const [, navigate] = useLocation();
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
      const response = await apiRequest("POST", "/api/customer/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('customerInfo', JSON.stringify(data));
      toast({
        title: t('auth.loginSuccess'),
        description: t('landing.title'),
      });
      navigate("/customer");
    },
    onError: (error: any) => {
      toast({
        title: t('auth.loginError'),
        description: t('auth.invalidCredentials'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Leaf className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('landing.title')}</h1>
          <p className="text-gray-600 mt-2">{t('landing.subtitle')}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {t('auth.login')}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {t('nav.ecoPoints')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder={t('auth.email')}
                            className="pl-10"
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
                      <FormLabel>{t('auth.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder={t('auth.password')}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/customer/forgot-password")}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            </Form>

            <Separator />

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {t('auth.dontHaveAccount')}
              </p>
              <Button
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => navigate("/customer/register")}
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
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            <span>{t('common.backToHome')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}