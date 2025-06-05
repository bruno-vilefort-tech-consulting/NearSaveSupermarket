import { Check, Clock, Package, Truck, CheckCircle } from "lucide-react";

interface OrderTimelineCompactProps {
  currentStatus: string;
  fulfillmentMethod: string;
  showLabels?: boolean;
}

export function OrderTimelineCompact({ 
  currentStatus, 
  fulfillmentMethod, 
  showLabels = false 
}: OrderTimelineCompactProps) {
  // Handle cancelled statuses - don't show timeline for cancelled orders
  if (currentStatus === 'cancelled-customer' || currentStatus === 'cancelled-staff' || currentStatus === 'cancelled') {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <span>
          {currentStatus === 'cancelled-customer' && '❌ Cancelado pelo Cliente'}
          {currentStatus === 'cancelled-staff' && '❌ Cancelado pelo Supermercado'}
          {currentStatus === 'cancelled' && '❌ Cancelado'}
        </span>
      </div>
    );
  }

  const getTimelineSteps = () => {
    const baseSteps = [
      { id: "pending", icon: <Clock className="w-3 h-3" /> },
      { id: "confirmed", icon: <Check className="w-3 h-3" /> },
      { id: "preparing", icon: <Package className="w-3 h-3" /> },
      { id: "ready", icon: <CheckCircle className="w-3 h-3" /> }
    ];

    if (fulfillmentMethod === "delivery") {
      baseSteps.push({ id: "shipped", icon: <Truck className="w-3 h-3" /> });
    }

    baseSteps.push({ id: "completed", icon: <CheckCircle className="w-3 h-3" /> });
    return baseSteps;
  };

  const steps = getTimelineSteps();
  const currentStepIndex = steps.findIndex(step => step.id === currentStatus);

  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isPending = index > currentStepIndex;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div 
              className={`
                flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300
                ${isCompleted 
                  ? "bg-eco-green border-eco-green text-white" 
                  : isCurrent && currentStatus !== "completed"
                  ? "bg-eco-blue border-eco-blue text-white animate-pulse"
                  : isCurrent && currentStatus === "completed"
                  ? "bg-eco-green border-eco-green text-white"
                  : "bg-eco-gray-light border-eco-gray text-eco-gray"
                }
              `}
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : isCurrent && currentStatus === "completed" ? (
                <Check className="w-3 h-3" />
              ) : (
                step.icon
              )}
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div 
                className={`
                  w-8 h-0.5 transition-all duration-500
                  ${isCompleted ? "bg-eco-green" : "bg-eco-gray-light"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}