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
import { useLanguage } from "@/hooks/useLanguage";
import { Leaf, User, Mail, Lock, Phone, FileText, ArrowLeft, Check, X } from "lucide-react";

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
  const { t } = useLanguage();
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se não são todos números iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;
    
    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;
    
    return parseInt(cleanCPF[9]) === digit1 && parseInt(cleanCPF[10]) === digit2;
  };

  const registerSchema = z.object({
    cpf: z.string()
      .min(1, 'CPF é obrigatório')
      .refine((cpf) => {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        return cleanCPF.length === 11;
      }, 'CPF deve ter 11 dígitos')
      .refine(validateCPF, 'CPF inválido'),
    fullName: z.string()
      .min(2, t('validation.nameMinLength'))
      .max(100, t('validation.nameTooLong')),
    phone: z.string()
      .min(1, 'Telefone é obrigatório')
      .refine((phone) => {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        return cleanPhone.length === 11;
      }, 'Telefone deve ter 11 dígitos (DDD + 9 dígitos)'),
    email: z.string()
      .min(1, 'Email é obrigatório')
      .email('Formato de email inválido')
      .refine((email) => {
        return validateEmail(email);
      }, 'Email deve ser válido'),
    password: z.string()
      .min(6, t('validation.passwordMinLength'))
      .max(100, t('validation.passwordTooLong')),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: t('validation.acceptTerms'),
    }),
  }).refine((data) => {
    console.log('🔍 Validando senhas:', { password: data.password, confirmPassword: data.confirmPassword, match: data.password === data.confirmPassword });
    return data.password === data.confirmPassword;
  }, {
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
    mode: "onChange",
  });

  // Debug form state
  console.log('🟡 Form errors:', form.formState.errors);
  console.log('🟡 Form isValid:', form.formState.isValid);
  console.log('🟡 Form values:', form.watch());

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      console.log('📤 Dados do formulário antes do processamento:', data);
      const { confirmPassword, acceptTerms, ...registerData } = data;
      console.log('📤 Dados enviados para API:', registerData);
      
      try {
        const response = await apiRequest("POST", "/api/customer/register", registerData);
        console.log('📥 Resposta da API:', response.status, response.statusText);
        const result = await response.json();
        console.log('📥 Dados retornados:', result);
        return result;
      } catch (error) {
        console.error('❌ Erro na requisição:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Cadastro realizado com sucesso:', data);
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.registerSuccessDescription'),
      });
      navigate("/login");
    },
    onError: (error: any) => {
      console.error('❌ Erro no cadastro:', error);
      toast({
        title: t('auth.registerError'),
        description: error.message || t('auth.registerErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log('🚀 Iniciando cadastro com dados:', data);
    console.log('🔍 Endpoint sendo usado:', '/api/customer/register');
    
    // Verificar se o formulário é válido
    if (!form.formState.isValid) {
      console.log('❌ Formulário inválido, erros:', form.formState.errors);
      toast({
        title: "Erro no formulário",
        description: "Por favor, corrija os erros destacados em vermelho.",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar dados para envio
    const submitData = {
      ...data,
      cpf: data.cpf.replace(/[^\d]/g, ''), // Remove formatação do CPF
      phone: data.phone.replace(/[^\d]/g, ''), // Remove formatação do telefone
    };
    
    console.log('📤 Dados preparados para envio:', submitData);
    registerMutation.mutate(submitData);
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedValue = cleanValue.slice(0, 11);
    
    return limitedValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedValue = cleanValue.slice(0, 11);
    
    if (limitedValue.length <= 2) {
      return `(${limitedValue}`;
    } else if (limitedValue.length <= 7) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
    } else {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`;
    }
  };

  return (
    <div className="min-h-screen bg-eco-gray-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-eco-gray-dark">{t('landing.title')}</h1>
          <div className="flex justify-center mt-2">
            <span className="text-eco-orange text-[10px] font-bold">By Up Brasil</span>
          </div>
          <p className="text-eco-gray mt-3">{t('customer.registerSubtitle')}</p>
        </div>

        <Card className="shadow-lg border-eco-green-light bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-eco-gray-dark">
              {t('customer.register')}
            </CardTitle>
            <p className="text-sm text-eco-gray">
              {t('customer.registerSubtitle')}
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => {
                console.log('🔴 Form submit interceptado');
                console.log('🔍 Event:', e);
                return form.handleSubmit(onSubmit)(e);
              }} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-eco-gray-dark">{t('customer.cpf')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            placeholder="000.000.000-00"
                            className={`pl-10 pr-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green ${
                              cpfValid === true ? 'border-eco-green' : 
                              cpfValid === false ? 'border-red-500' : ''
                            }`}
                            onChange={(e) => {
                              const formatted = formatCPF(e.target.value);
                              field.onChange(formatted);
                              
                              // Validação em tempo real
                              const cleanCPF = formatted.replace(/[^\d]/g, '');
                              if (cleanCPF.length === 11) {
                                setCpfValid(validateCPF(formatted));
                              } else if (cleanCPF.length === 0) {
                                setCpfValid(null);
                              } else {
                                setCpfValid(false);
                              }
                            }}
                          />
                          {cpfValid !== null && (
                            <div className="absolute right-3 top-3">
                              {cpfValid ? (
                                <Check className="h-4 w-4 text-eco-green" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
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
                      <FormLabel className="text-eco-gray-dark">{t('customer.fullName')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            placeholder={t('customer.fullNamePlaceholder')}
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-eco-gray-dark">{t('customer.phone')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            placeholder="(11) 99999-9999"
                            className={`pl-10 pr-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green ${
                              phoneValid === true ? 'border-eco-green' : 
                              phoneValid === false ? 'border-red-500' : ''
                            }`}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                              
                              // Validação em tempo real
                              const cleanPhone = formatted.replace(/[^\d]/g, '');
                              if (cleanPhone.length === 11) {
                                setPhoneValid(true);
                              } else if (cleanPhone.length === 0) {
                                setPhoneValid(null);
                              } else {
                                setPhoneValid(false);
                              }
                            }}
                          />
                          {phoneValid !== null && (
                            <div className="absolute right-3 top-3">
                              {phoneValid ? (
                                <Check className="h-4 w-4 text-eco-green" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
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
                      <FormLabel className="text-eco-gray-dark">{t('auth.email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="exemplo@email.com"
                            className={`pl-10 pr-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green ${
                              emailValid === true ? 'border-eco-green' : 
                              emailValid === false ? 'border-red-500' : ''
                            }`}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              
                              // Validação em tempo real
                              if (e.target.value.length === 0) {
                                setEmailValid(null);
                              } else if (e.target.value.length >= 5) {
                                setEmailValid(validateEmail(e.target.value));
                              } else {
                                setEmailValid(false);
                              }
                            }}
                          />
                          {emailValid !== null && (
                            <div className="absolute right-3 top-3">
                              {emailValid ? (
                                <Check className="h-4 w-4 text-eco-green" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
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
                            type="password"
                            placeholder={t('auth.passwordMinLength')}
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-eco-gray-dark">{t('auth.confirmPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
                          <Input
                            {...field}
                            type="password"
                            placeholder={t('auth.confirmPassword')}
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
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-eco-gray-light data-[state=checked]:bg-eco-green data-[state=checked]:border-eco-green"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal text-eco-gray-dark">
                          Aceito os{" "}
                          <button
                            type="button"
                            onClick={() => window.open("/terms-and-conditions", "_blank")}
                            className="text-eco-blue hover:text-eco-blue-dark font-medium underline"
                          >
                            Termos e Condições
                          </button>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-eco-green to-eco-green-dark hover:from-eco-green-dark hover:to-eco-green text-white font-semibold py-3.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
                  disabled={registerMutation.isPending}
                  onClick={() => {
                    console.log('🔵 Botão Cadastrar clicado!');
                    console.log('🔍 Erros do formulário:', form.formState.errors);
                    console.log('🔍 Formulário válido?', form.formState.isValid);
                    console.log('🔍 Valores do formulário:', form.getValues());
                  }}
                >
                  {registerMutation.isPending ? t('customer.registering') : t('auth.register')}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-eco-gray">
                {t('customer.alreadyHaveAccount')}{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-eco-blue hover:text-eco-blue-dark font-medium transition-colors"
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
            onClick={() => navigate("/login")}
            className="inline-flex items-center space-x-2 text-eco-gray hover:text-eco-gray-dark transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar para Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}