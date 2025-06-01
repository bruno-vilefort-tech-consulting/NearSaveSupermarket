import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Termos e Condições de Uso
          </h1>
          <p className="text-gray-600">
            Última atualização: Janeiro de 2025
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-green-700">
              Termos e Condições Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                1. Aceitação dos Termos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Ao utilizar nossa plataforma de sustentabilidade e gestão de produtos alimentícios, 
                você concorda com todos os termos estabelecidos neste documento. Nossa missão é 
                conectar supermercados e consumidores na luta contra o desperdício alimentar, 
                promovendo práticas mais sustentáveis no varejo brasileiro.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                2. Uso da Plataforma
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Nossa plataforma permite que estabelecimentos comerciais cadastrem produtos próximos 
                ao vencimento com descontos especiais, enquanto consumidores podem localizar essas 
                ofertas sustentáveis. O sistema de pontos ecológicos incentiva compras conscientes 
                e recompensa ações ambientalmente responsáveis.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                3. Responsabilidades dos Usuários
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-2">
                <p><strong>Supermercados:</strong> Devem manter informações precisas sobre produtos, datas de validade e disponibilidade.</p>
                <p><strong>Consumidores:</strong> Comprometem-se a retirar produtos adquiridos nos prazos estabelecidos.</p>
                <p><strong>Ambos:</strong> Devem respeitar as diretrizes de sustentabilidade e combate ao desperdício.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                4. Sistema de Pontos Ecológicos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Os pontos ecológicos são calculados baseados no impacto ambiental positivo de cada 
                compra sustentável. Produtos próximos ao vencimento, categorias específicas e volume 
                de compras influenciam na pontuação. Estes pontos podem ser utilizados para descontos 
                futuros ou trocados por benefícios ambientais.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                5. Política de Privacidade
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Protegemos rigorosamente os dados pessoais de nossos usuários. Informações como CPF, 
                endereços e histórico de compras são tratadas com máxima segurança, seguindo a 
                Lei Geral de Proteção de Dados (LGPD). Dados são utilizados exclusivamente para 
                melhorar a experiência na plataforma e promover sustentabilidade.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                6. Métodos de Pagamento
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Aceitamos pagamentos via PIX para garantir transações rápidas e seguras. O código 
                PIX é gerado automaticamente para cada pedido, permitindo pagamento por cópia do 
                código ou leitura via aplicativo bancário. Pedidos são confirmados automaticamente 
                após identificação do pagamento.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                7. Cancelamentos e Reembolsos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Devido à natureza perecível dos produtos, cancelamentos devem ser solicitados em 
                até 30 minutos após a confirmação do pedido. Reembolsos são processados via PIX 
                na mesma conta utilizada para pagamento, considerando nossa política de sustentabilidade 
                e redução de desperdício alimentar.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                8. Limitações e Responsabilidades
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A plataforma atua como intermediadora entre supermercados e consumidores. Não nos 
                responsabilizamos pela qualidade final dos produtos, que permanece sob responsabilidade 
                do estabelecimento vendedor. Nosso compromisso é facilitar transações sustentáveis 
                e promover a redução do desperdício alimentar no Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                9. Alterações nos Termos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Reservamo-nos o direito de atualizar estes termos periodicamente para refletir 
                melhorias na plataforma e mudanças na legislação. Usuários serão notificados sobre 
                alterações significativas via email ou notificações na plataforma, mantendo sempre 
                nosso foco na transparência e sustentabilidade.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                10. Contato e Suporte
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Para dúvidas sobre estes termos, questões técnicas ou sugestões de melhorias 
                sustentáveis, nossa equipe está disponível através dos canais de atendimento da 
                plataforma. Valorizamos feedback que contribua para um ecossistema mais sustentável 
                no varejo alimentício brasileiro.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="inline-flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Button>
          
          <Button
            onClick={() => navigate("/")}
            className="bg-green-600 hover:bg-green-700"
          >
            Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
}