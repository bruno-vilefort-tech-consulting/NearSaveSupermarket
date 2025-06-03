import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">
              Política de Privacidade - EcoMarket
            </CardTitle>
            <p className="text-gray-600">Última atualização: 03 de junho de 2025</p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Informações que Coletamos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dados de Localização:</strong> Utilizamos sua localização para encontrar supermercados próximos dentro de um raio de 20km</li>
                <li><strong>Informações de Conta:</strong> Nome, email e telefone para criação e gerenciamento da conta</li>
                <li><strong>Dados de Pagamento:</strong> Processamos pagamentos via PIX através de provedores seguros</li>
                <li><strong>Histórico de Compras:</strong> Registramos suas compras para acompanhamento de pedidos e pontos ecológicos</li>
                <li><strong>Preferências:</strong> Categorias de produtos e supermercados favoritos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Como Usamos suas Informações</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer serviços de localização de supermercados próximos</li>
                <li>Processar pedidos e pagamentos via PIX</li>
                <li>Calcular e atribuir pontos ecológicos por compras sustentáveis</li>
                <li>Enviar notificações sobre status de pedidos e ofertas especiais</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Cumprir obrigações legais e regulamentares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Compartilhamento de Dados</h2>
              <p className="mb-3">Compartilhamos seus dados apenas quando necessário:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supermercados Parceiros:</strong> Informações de pedidos para processamento</li>
                <li><strong>Processadores de Pagamento:</strong> Dados necessários para transações PIX</li>
                <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="mt-3 font-semibold">Nunca vendemos seus dados pessoais a terceiros.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Seus Direitos (LGPD)</h2>
              <p className="mb-3">Conforme a Lei Geral de Proteção de Dados, você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmação da existência de tratamento de dados</li>
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos ou inexatos</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados a outro fornecedor</li>
                <li>Revogação do consentimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Segurança dos Dados</h2>
              <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Criptografia de dados sensíveis</li>
                <li>Acesso restrito a funcionários autorizados</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups seguros e redundantes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
              <p>Mantemos seus dados pelo tempo necessário para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Fornecer nossos serviços enquanto sua conta estiver ativa</li>
                <li>Cumprir obrigações legais (até 5 anos para dados fiscais)</li>
                <li>Resolver disputas e fazer cumprir acordos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies e Tecnologias Similares</h2>
              <p>Utilizamos cookies e tecnologias similares para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Manter você conectado à sua conta</li>
                <li>Lembrar suas preferências</li>
                <li>Melhorar a performance da aplicação</li>
                <li>Analisar o uso dos nossos serviços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
                através do aplicativo ou email. O uso continuado dos serviços após as alterações constitui 
                aceitação da nova política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
              <p>Para questões sobre privacidade ou exercer seus direitos, entre em contato:</p>
              <div className="bg-gray-100 p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> privacidade@ecomarket.com.br</p>
                <p><strong>Telefone:</strong> (11) 99999-9999</p>
                <p><strong>Endereço:</strong> São Paulo, SP - Brasil</p>
              </div>
            </section>

            <div className="bg-green-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-green-800">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD) 
                e demais regulamentações aplicáveis no Brasil.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}