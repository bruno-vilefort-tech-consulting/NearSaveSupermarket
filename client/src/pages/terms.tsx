import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">
              Termos de Uso - EcoMarket
            </CardTitle>
            <p className="text-gray-600">Última atualização: 03 de junho de 2025</p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao utilizar o aplicativo EcoMarket, você concorda com estes termos de uso. 
                Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
              <p>O EcoMarket é uma plataforma que conecta consumidores a supermercados, oferecendo:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Localização de supermercados em um raio de 20km</li>
                <li>Sistema de compras com pagamento via PIX</li>
                <li>Programa de pontos ecológicos por compras sustentáveis</li>
                <li>Acompanhamento de pedidos em tempo real</li>
                <li>Notificações sobre ofertas e status de pedidos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Cadastro e Conta do Usuário</h2>
              <p>Para utilizar nossos serviços, você deve:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a segurança de sua conta e senha</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
                <li>Notificar imediatamente sobre uso não autorizado</li>
                <li>Ter pelo menos 18 anos ou consentimento parental</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Uso Aceitável</h2>
              <p>Ao usar o EcoMarket, você concorda em NÃO:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Violar leis ou regulamentos aplicáveis</li>
                <li>Usar o serviço para atividades fraudulentas</li>
                <li>Interferir no funcionamento da plataforma</li>
                <li>Tentar acessar contas de outros usuários</li>
                <li>Usar dados coletados para fins não autorizados</li>
                <li>Criar contas múltiplas para burlar limitações</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Pedidos e Pagamentos</h2>
              <div className="space-y-3">
                <h3 className="font-semibold">5.1 Pedidos</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Todos os pedidos estão sujeitos à disponibilidade de produtos</li>
                  <li>Preços podem variar entre supermercados</li>
                  <li>Limitamos um carrinho por supermercado por transação</li>
                </ul>
                
                <h3 className="font-semibold">5.2 Pagamentos</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Pagamentos são processados exclusivamente via PIX</li>
                  <li>Você é responsável por taxas bancárias aplicáveis</li>
                  <li>Pagamentos são processados por terceiros seguros</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Programa de Pontos Ecológicos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pontos são concedidos por compras de produtos próximos ao vencimento</li>
                <li>Pontos não têm valor monetário direto</li>
                <li>Regras de pontuação podem ser alteradas com aviso prévio</li>
                <li>Pontos podem expirar conforme política específica</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Política de Cancelamento e Reembolso</h2>
              <div className="space-y-3">
                <h3 className="font-semibold">7.1 Cancelamento</h3>
                <p>Pedidos podem ser cancelados:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Antes da confirmação pelo supermercado</li>
                  <li>Dentro de 10 minutos após o pagamento</li>
                  <li>Por indisponibilidade de produtos</li>
                </ul>
                
                <h3 className="font-semibold">7.2 Reembolsos</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Reembolsos são processados via PIX em até 5 dias úteis</li>
                  <li>Produtos danificados podem ser trocados ou reembolsados</li>
                  <li>Evidências fotográficas podem ser solicitadas</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Responsabilidades e Limitações</h2>
              <div className="space-y-3">
                <h3 className="font-semibold">8.1 Nossa Responsabilidade</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Facilitar a conexão entre consumidores e supermercados</li>
                  <li>Manter a segurança da plataforma</li>
                  <li>Processar pagamentos de forma segura</li>
                </ul>
                
                <h3 className="font-semibold">8.2 Limitações</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Não somos responsáveis pela qualidade dos produtos</li>
                  <li>Não garantimos disponibilidade contínua do serviço</li>
                  <li>Limitamos responsabilidade ao valor da transação</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Propriedade Intelectual</h2>
              <p>
                O EcoMarket e todo seu conteúdo são protegidos por direitos autorais e outras leis 
                de propriedade intelectual. Você não pode reproduzir, distribuir ou modificar 
                qualquer parte do aplicativo sem autorização expressa.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Suspensão e Encerramento</h2>
              <p>Podemos suspender ou encerrar sua conta se:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Violar estes termos de uso</li>
                <li>Usar o serviço de forma fraudulenta</li>
                <li>Causar danos à plataforma ou outros usuários</li>
                <li>Por razões legais ou regulamentares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Alterações nos Termos</h2>
              <p>
                Podemos modificar estes termos a qualquer momento. Alterações significativas 
                serão comunicadas através do aplicativo ou email. O uso continuado após as 
                alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Lei Aplicável e Foro</h2>
              <p>
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa será 
                resolvida no foro da comarca de São Paulo, SP, Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contato</h2>
              <p>Para questões sobre estes termos, entre em contato:</p>
              <div className="bg-gray-100 p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> legal@ecomarket.com.br</p>
                <p><strong>Telefone:</strong> (11) 99999-9999</p>
                <p><strong>Endereço:</strong> São Paulo, SP - Brasil</p>
              </div>
            </section>

            <div className="bg-green-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-green-800">
                Ao utilizar o EcoMarket, você confirma ter lido, compreendido e concordado 
                com todos os termos e condições descritos neste documento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}