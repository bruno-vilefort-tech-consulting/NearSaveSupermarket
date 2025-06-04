import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Leaf } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useEffect, useState } from "react";

export default function TermsAndConditions() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [previousPage, setPreviousPage] = useState("/customer/register");

  useEffect(() => {
    // Detecta de onde o usuário veio baseado no referrer
    const referrer = document.referrer;
    if (referrer.includes("/customer/register")) {
      setPreviousPage("/customer/register");
    } else if (referrer.includes("/customer/login")) {
      setPreviousPage("/customer/login");
    } else if (referrer.includes("/")) {
      setPreviousPage("/");
    }
  }, []);

  return (
    <div className="min-h-screen bg-eco-gray-light p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-eco-green rounded-full flex items-center justify-center">
              <Leaf className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-eco-gray-dark">EcoMart</h1>
          <div className="flex justify-center mt-2">
            <span className="text-eco-orange text-[10px] font-bold">By Up Brasil</span>
          </div>
        </div>

        <Card className="shadow-lg border-eco-green-light bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-eco-gray-dark">
              Termos e Condições de Uso
            </CardTitle>
            <p className="text-eco-gray mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">1. Aceitação dos Termos</h2>
              <p className="text-eco-gray leading-relaxed">
                Ao acessar e usar o EcoMart, você concorda em cumprir e estar vinculado a estes Termos e Condições de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">2. Descrição do Serviço</h2>
              <p className="text-eco-gray leading-relaxed">
                O EcoMart é uma plataforma digital que conecta supermercados e consumidores para a venda de produtos próximos 
                ao vencimento com desconto, promovendo sustentabilidade e redução do desperdício de alimentos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">3. Cadastro e Conta do Usuário</h2>
              <div className="text-eco-gray leading-relaxed space-y-2">
                <p>Para usar nossos serviços, você deve:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Fornecer informações verdadeiras, atuais e completas</li>
                  <li>Manter a segurança de sua senha</li>
                  <li>Ser responsável por todas as atividades em sua conta</li>
                  <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">4. Produtos e Preços</h2>
              <div className="text-eco-gray leading-relaxed space-y-2">
                <p>Sobre os produtos oferecidos:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Os produtos estão próximos ao vencimento mas ainda são seguros para consumo</li>
                  <li>Os preços são definidos pelos supermercados parceiros</li>
                  <li>Disponibilidade sujeita ao estoque</li>
                  <li>Produtos devem ser consumidos rapidamente após a compra</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">5. Pagamentos e Reembolsos</h2>
              <div className="text-eco-gray leading-relaxed space-y-2">
                <p>Condições de pagamento:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Aceitamos pagamento via PIX</li>
                  <li>Pagamento deve ser efetuado no momento da compra</li>
                  <li>Reembolsos são processados conforme nossa política específica</li>
                  <li>Tempo de processamento de reembolso: até 5 dias úteis</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">6. Programa Eco Points</h2>
              <p className="text-eco-gray leading-relaxed">
                O programa Eco Points recompensa compras sustentáveis. Os pontos têm validade e podem ser utilizados 
                conforme regulamento específico do programa, disponível em nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">7. Privacidade e Proteção de Dados</h2>
              <p className="text-eco-gray leading-relaxed">
                Respeitamos sua privacidade e protegemos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD). 
                Consulte nossa Política de Privacidade para mais detalhes sobre coleta, uso e proteção de suas informações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">8. Responsabilidades do Usuário</h2>
              <div className="text-eco-gray leading-relaxed space-y-2">
                <p>O usuário se compromete a:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Usar a plataforma de forma ética e legal</li>
                  <li>Não violar direitos de terceiros</li>
                  <li>Não utilizar a plataforma para atividades fraudulentas</li>
                  <li>Respeitar os prazos de validade dos produtos</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">9. Limitação de Responsabilidade</h2>
              <p className="text-eco-gray leading-relaxed">
                O EcoMart atua como intermediário entre supermercados e consumidores. Não nos responsabilizamos por 
                problemas relacionados à qualidade dos produtos além dos prazos informados pelos estabelecimentos parceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">10. Modificações dos Termos</h2>
              <p className="text-eco-gray leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor 
                imediatamente após a publicação. O uso continuado da plataforma constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-eco-gray-dark mb-3">11. Contato</h2>
              <p className="text-eco-gray leading-relaxed">
                Para dúvidas sobre estes Termos e Condições, entre em contato conosco através dos canais 
                disponíveis em nossa plataforma.
              </p>
            </section>

            <div className="mt-8 p-4 bg-eco-green-light rounded-lg">
              <p className="text-eco-gray-dark text-sm">
                <strong>Importante:</strong> Ao marcar a opção "Aceito os Termos e Condições" durante o cadastro, 
                você confirma que leu, compreendeu e concorda com todos os termos aqui descritos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botão Voltar */}
        <div className="text-center mt-6">
          <Button
            onClick={() => navigate(previousPage)}
            variant="outline"
            className="inline-flex items-center space-x-2 border-eco-gray text-eco-gray hover:bg-eco-gray-light"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}