import { Check, Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";

interface OrderTimelineProps {
  currentStatus: string;
  fulfillmentMethod: string;
  createdAt: string;
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function OrderTimeline({ currentStatus, fulfillmentMethod, createdAt }: OrderTimelineProps) {
  const getTimelineSteps = (): TimelineStep[] => {
    // Se o pedido foi cancelado, mostra apenas o status de cancelado
    if (currentStatus === "cancelled") {
      return [
        {
          id: "cancelled",
          label: "Pedido Cancelado",
          icon: <XCircle className="w-4 h-4" />,
          description: "O pedido foi cancelado pelo supermercado"
        }
      ];
    }

    const baseSteps = [
      {
        id: "pending",
        label: "Pedido Recebido",
        icon: <Clock className="w-4 h-4" />,
        description: "Aguardando confirmação"
      },
      {
        id: "confirmed",
        label: "Confirmado",
        icon: <Check className="w-4 h-4" />,
        description: "Pedido confirmado pelo supermercado"
      },
      {
        id: "preparing",
        label: "Preparando",
        icon: <Package className="w-4 h-4" />,
        description: "Separando seus produtos"
      },
      {
        id: "ready",
        label: "Pronto",
        icon: <CheckCircle className="w-4 h-4" />,
        description: fulfillmentMethod === "delivery" ? "Pronto para entrega" : "Pronto para retirada"
      }
    ];

    if (fulfillmentMethod === "delivery") {
      baseSteps.push({
        id: "shipped",
        label: "Em Entrega",
        icon: <Truck className="w-4 h-4" />,
        description: "A caminho do endereço"
      });
    }

    baseSteps.push({
      id: "completed",
      label: "Concluído",
      icon: <CheckCircle className="w-4 h-4" />,
      description: fulfillmentMethod === "delivery" ? "Entregue com sucesso" : "Retirado com sucesso"
    });

    return baseSteps;
  };

  const steps = getTimelineSteps();
  const currentStepIndex = steps.findIndex(step => step.id === currentStatus);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "current";
    return "pending";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Status do Pedido</h3>
        <span className="text-xs text-gray-500">
          Criado em {formatDate(createdAt)}
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          
          return (
            <div key={step.id} className="relative">
              {/* Conectar linha entre os steps */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute left-4 top-8 w-0.5 h-6 ${
                    status === "completed" ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
              
              <div className="flex items-start space-x-3">
                {/* Ícone do step */}
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    status === "completed" 
                      ? "bg-green-500 border-green-500 text-white" 
                      : status === "current"
                      ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Conteúdo do step */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center space-x-2">
                    <h4 
                      className={`text-sm font-medium ${
                        status === "completed" || status === "current"
                          ? "text-gray-900" 
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </h4>
                    {status === "current" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Atual
                      </span>
                    )}
                  </div>
                  <p 
                    className={`text-xs mt-1 ${
                      status === "completed" || status === "current"
                        ? "text-gray-600" 
                        : "text-gray-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Progresso</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}