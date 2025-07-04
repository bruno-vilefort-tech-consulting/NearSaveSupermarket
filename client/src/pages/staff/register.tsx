import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Store, Mail, Lock, Building, Phone, MapPin, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

// Função para validar CNPJ
function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cnpj[12]) !== digito1) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  
  return parseInt(cnpj[13]) === digito2;
}

// Função para formatar CNPJ
function formatCNPJ(value: string): string {
  const cnpj = value.replace(/[^\d]/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  companyName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  cnpj: z.string()
    .min(14, "CNPJ deve ter 14 dígitos")
    .refine((cnpj) => validateCNPJ(cnpj), "CNPJ inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  address: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme a senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function StaffRegister() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [cnpjValue, setCnpjValue] = useState("");
  const [cnpjError, setCnpjError] = useState("");
  const [isCheckingCnpj, setIsCheckingCnpj] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cnpj: '',
    },
  });

  const checkCnpjAvailability = async (cnpj: string) => {
    if (cnpj.length !== 14) return;
    
    setIsCheckingCnpj(true);
    setCnpjError("");
    
    try {
      const response = await fetch(`/api/staff/validate-cnpj/${cnpj}`);
      const data = await response.json();
      
      if (!data.available) {
        if (data.status === 'pending') {
          setCnpjError("Este CNPJ já está cadastrado e aguarda aprovação.");
        } else if (data.status === 'approved') {
          setCnpjError("Este CNPJ já está cadastrado e aprovado.");
        } else if (data.status === 'rejected') {
          setCnpjError("Este CNPJ foi rejeitado anteriormente. Entre em contato com o suporte.");
        } else {
          setCnpjError("Este CNPJ já está cadastrado.");
        }
      }
    } catch (error) {
      console.error("Erro ao validar CNPJ:", error);
    } finally {
      setIsCheckingCnpj(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    const formattedValue = formatCNPJ(value);
    setCnpjValue(formattedValue);
    setValue('cnpj', value); // Store only numbers for validation
    
    // Check CNPJ availability after formatting
    if (value.length === 14) {
      checkCnpjAvailability(value);
    } else {
      setCnpjError("");
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setRegisterError("");

      // Check if there's a CNPJ error before submitting
      if (cnpjError) {
        setRegisterError("Corrija os erros antes de prosseguir.");
        return;
      }
      
      const { confirmPassword, ...submitData } = data;
      
      const response = await apiRequest("POST", "/api/staff/register", submitData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro no cadastro");
      }

      setIsSuccess(true);
      
      toast({
        title: "Cadastro realizado!",
        description: "Seu supermercado foi cadastrado e aguarda aprovação do administrador.",
      });

      // Redirect to landing page after 3 seconds
      setTimeout(() => {
        setLocation("/supermercado");
      }, 3000);
      
    } catch (error: any) {
      console.error("Register error:", error);
      setRegisterError(error.message || "Erro no cadastro. Tente novamente.");
      
      toast({
        title: "Erro no cadastro",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-green/5 to-eco-orange/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cadastro Realizado!
              </h2>
              <p className="text-gray-600">
                Seu supermercado foi cadastrado com sucesso. Redirecionando para o login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-green/5 to-eco-orange/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-eco-green/10 p-3 rounded-full w-fit">
            <Store className="h-8 w-8 text-eco-green" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Cadastro do Supermercado
            </CardTitle>
            <CardDescription className="text-gray-600">
              Registre seu supermercado na plataforma SaveUp
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {registerError && (
            <Alert variant="destructive">
              <AlertDescription>{registerError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Ex: Supermercado Central"
                  className="pl-10"
                  {...register("companyName")}
                />
              </div>
              {errors.companyName && (
                <p className="text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  className={`pl-10 ${cnpjError ? 'border-red-500' : ''}`}
                  value={cnpjValue}
                  onChange={handleCnpjChange}
                  maxLength={18}
                />
                {isCheckingCnpj && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              {errors.cnpj && (
                <p className="text-sm text-red-600">{errors.cnpj.message}</p>
              )}
              {cnpjError && (
                <p className="text-sm text-red-600">{cnpjError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@seusupermercado.com"
                  className="pl-10"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  type="text"
                  placeholder="Rua, número, bairro, cidade"
                  className="pl-10"
                  {...register("address")}
                />
              </div>
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-600 text-center mb-4">
                Ao se cadastrar, você concorda com nossos termos de uso
              </p>
              
              <Button 
                type="submit" 
                className="w-full bg-eco-green hover:bg-eco-green-dark text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar Supermercado"
                )}
              </Button>
            </div>
          </form>

          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/staff">
                <Button variant="link" className="text-eco-green hover:text-eco-green-dark p-0 h-auto">
                  Fazer login
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StaffRegister;