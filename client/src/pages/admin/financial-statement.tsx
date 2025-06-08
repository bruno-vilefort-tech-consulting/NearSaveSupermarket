import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Receipt, Download, Search, Eye, Calendar, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialItem {
  orderId: number;
  customerName: string;
  customerEmail: string | null;
  supermarketId: number;
  supermarketName: string;
  orderTotal: string;
  commercialRate: string;
  rateAmount: string;
  amountToReceive: string;
  orderDate: Date | null;
  paymentTerms: number;
  paymentDate: Date;
  status: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

function AdminFinancialStatement() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<FinancialItem | null>(null);

  useEffect(() => {
    const adminInfo = localStorage.getItem('adminInfo');
    if (!adminInfo) {
      setLocation('/admin');
      return;
    }
  }, [setLocation]);

  const { data: financialData = [], isLoading } = useQuery<FinancialItem[]>({
    queryKey: ["/api/admin/financial-statement"],
    retry: false,
  });

  const filteredData = financialData.filter(item =>
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supermarketName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orderId.toString().includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { variant: 'default' as const, label: 'Concluído' },
      'payment_confirmed': { variant: 'default' as const, label: 'Pagamento Confirmado' },
      'prepared': { variant: 'secondary' as const, label: 'Preparado' },
      'shipped': { variant: 'secondary' as const, label: 'Enviado' },
      'picked_up': { variant: 'default' as const, label: 'Retirado' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  };

  const totalRevenue = filteredData.reduce((sum, item) => sum + parseFloat(item.orderTotal), 0);
  const totalCommission = filteredData.reduce((sum, item) => sum + parseFloat(item.rateAmount), 0);
  const totalToReceive = filteredData.reduce((sum, item) => sum + parseFloat(item.amountToReceive), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <Receipt className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Extrato Financeiro</h1>
              </div>
            </div>
            <Button className="bg-eco-green hover:bg-eco-green-dark text-white">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue.toString())}</div>
              <p className="text-xs text-muted-foreground">Total de vendas processadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommission.toString())}</div>
              <p className="text-xs text-muted-foreground">Taxa comercial arrecadada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber Supermercados</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalToReceive.toString())}</div>
              <p className="text-xs text-muted-foreground">Valor líquido a pagar</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pedidos Financeiros</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, supermercado ou pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum registro financeiro encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Supermercado</TableHead>
                      <TableHead>Data Pedido</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Taxa (%)</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>A Receber</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.orderId}>
                        <TableCell className="font-medium">#{item.orderId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.customerName}</div>
                            {item.customerEmail && (
                              <div className="text-sm text-gray-500">{item.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.supermarketName}</TableCell>
                        <TableCell>{item.orderDate ? formatDate(item.orderDate) : '-'}</TableCell>
                        <TableCell>{formatDate(item.paymentDate)}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(item.orderTotal)}
                        </TableCell>
                        <TableCell>{item.commercialRate}%</TableCell>
                        <TableCell className="font-medium text-purple-600">
                          {formatCurrency(item.rateAmount)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatCurrency(item.amountToReceive)}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Detalhes do Pedido #{selectedOrder.orderId}</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Fechar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Nome:</strong> {selectedOrder.customerName}</div>
                    <div><strong>Email:</strong> {selectedOrder.customerEmail || 'Não informado'}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Financeiras</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Supermercado:</strong> {selectedOrder.supermarketName}</div>
                    <div><strong>Taxa Comercial:</strong> {selectedOrder.commercialRate}%</div>
                    <div><strong>Prazo Pagamento:</strong> {selectedOrder.paymentTerms} dias</div>
                    <div><strong>Data Pagamento:</strong> {formatDate(selectedOrder.paymentDate)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedOrder.orderTotal)}
                      </div>
                      <div className="text-sm text-gray-600">Valor Total do Pedido</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(selectedOrder.rateAmount)}
                      </div>
                      <div className="text-sm text-gray-600">Comissão SaveUp</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(selectedOrder.amountToReceive)}
                      </div>
                      <div className="text-sm text-gray-600">Valor a Receber</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFinancialStatement;