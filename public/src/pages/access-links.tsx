import { Copy, ExternalLink, Users, Shield, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AccessLinks() {
  const { toast } = useToast();
  const baseUrl = window.location.origin;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const links = [
    {
      title: "Acesso para Clientes",
      description: "Portal principal para clientes finais",
      url: `${baseUrl}/`,
      icon: Store,
      color: "bg-green-500"
    },
    {
      title: "Painel Staff (Supermercados)",
      description: "Dashboard para funcionários de supermercados",
      url: `${baseUrl}/staff`,
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Painel Admin (SaveUp)",
      description: "Dashboard administrativo da SaveUp",
      url: `${baseUrl}/admin`,
      icon: Shield,
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SaveUp - Links de Acesso</h1>
          <p className="text-lg text-gray-600">Links diretos para os diferentes painéis do sistema</p>
          <p className="text-sm text-gray-500 mt-2">Domínio de produção: <strong>{baseUrl}</strong></p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {links.map((link, index) => {
            const IconComponent = link.icon;
            
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.color} text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {link.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-mono text-gray-700 break-all">
                      {link.url}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(link.url, link.title)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => openInNewTab(link.url)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Abrir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Como usar os links</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div>
                <h4 className="font-semibold text-green-600">🛒 Portal do Cliente</h4>
                <p className="text-sm text-gray-600">
                  Link principal para clientes. Cadastro, login, compras e acompanhamento de pedidos.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-600">👥 Painel Staff</h4>
                <p className="text-sm text-gray-600">
                  Para funcionários de supermercados. Gerenciamento de produtos, pedidos, marketing e financeiro.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-600">🛡️ Painel Admin</h4>
                <p className="text-sm text-gray-600">
                  Para administradores da SaveUp. Supervisão geral, relatórios financeiros e gestão de supermercados.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  <strong>Dica:</strong> Salve estes links nos seus favoritos ou compartilhe com sua equipe conforme necessário.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}