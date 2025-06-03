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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Leaf, User, Mail, Lock, Phone, FileText, ArrowLeft } from "lucide-react";

type RegisterFormData = {
  cpf: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export default function CustomerRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const registerSchema = z.object({
    cpf: z.string()
      .min(11, t('validation.cpfMinLength'))
      .max(14, t('validation.cpfInvalid'))
      .regex(/^[0-9.-]+$/, t('validation.cpfFormat')),
    fullName: z.string()
      .min(2, t('validation.nameMinLength'))
      .max(100, t('validation.nameTooLong')),
    phone: z.string()
      .min(10, t('validation.phoneMinLength'))
      .max(15, t('validation.phoneInvalid')),
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string()
      .min(6, t('validation.passwordMinLength'))
      .max(100, t('validation.passwordTooLong')),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: t('validation.acceptTerms'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ["confirmPassword"],
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cpf: "",
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, acceptTerms, ...registerData } = data;
      const response = await apiRequest("POST", "/api/customer/register", registerData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.registerSuccessDescription'),
      });
      navigate("/customer/login");
    },
    onError: (error: any) => {
      toast({
        title: t('auth.registerError'),
        description: t('auth.registerErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Leaf className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('landing.title')}</h1>
          <p className="text-gray-600 mt-2">{t('customer.registerSubtitle')}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {t('customer.register')}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {t('customer.registerSubtitle')}
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customer.cpf')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="000.000.000-00"
                            className="pl-10"
                            onChange={(e) => {
                              const formatted = formatCPF(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customer.fullName')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder={t('customer.fullNamePlaceholder')}
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customer.phone')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="(11) 99999-9999"
                            className="pl-10"
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            placeholder={t('auth.emailPlaceholder')}
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
                            placeholder={t('auth.passwordMinLength')}
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder={t('auth.confirmPassword')}
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
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          {t('customer.acceptTerms')}
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? t('customer.registering') : t('auth.register')}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                {t('customer.alreadyHaveAccount')}{" "}
                <button
                  onClick={() => navigate("/customer/login")}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {t('auth.login')}
                </button>
              </p>
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
            <span>{t('customer.backToHome')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}