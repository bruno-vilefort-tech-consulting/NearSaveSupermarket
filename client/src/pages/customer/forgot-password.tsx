import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { Leaf, Mail, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiRequest("POST", "/api/customer/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.emailSentSuccess'),
        description: t('auth.emailSentDesc'),
      });
      navigate("/customer/login");
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: t('auth.emailSentError'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-eco-gray-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-eco-green rounded-full flex items-center justify-center">
              <Leaf className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-eco-gray-dark">SaveUp</h1>
          <div className="flex justify-center mt-2">
            <span className="text-eco-orange text-[10px] font-bold">By Up Brasil</span>
          </div>
          <p className="text-eco-gray mt-3">{t('auth.recoverySubtitle')}</p>
        </div>

        {/* Formulário */}
        <Card className="shadow-lg border-eco-green-light bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-eco-gray-dark">
              {t('auth.forgotPasswordTitle')}
            </CardTitle>
            <p className="text-sm text-eco-gray">
              {t('auth.forgotPasswordDescription')}
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            placeholder="exemplo@email.com"
                            className="pl-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-3 rounded-xl transition-colors"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? t('auth.sending') : t('auth.sendInstructions')}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate("/customer/login")}
                className="text-eco-blue hover:text-eco-blue-dark font-medium transition-colors"
              >
                {t('auth.backToLogin')}
              </button>
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