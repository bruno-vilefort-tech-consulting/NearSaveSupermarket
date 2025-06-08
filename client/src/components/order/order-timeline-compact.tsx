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
    return null; // Don't show timeline or additional text for cancelled orders
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
    <div className="w-full overflow-x-auto">
      <div className="flex items-center space-x-1 min-w-max px-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              {/* Step circle */}
              <div 
                className={`
                  flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-300
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
                  <Check className="w-2.5 h-2.5" />
                ) : isCurrent && currentStatus === "completed" ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <div className="w-2.5 h-2.5 flex items-center justify-center">
                    {step.icon}
                  </div>
                )}
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div 
                  className={`
                    w-4 sm:w-6 h-0.5 transition-all duration-500 flex-shrink-0
                    ${isCompleted ? "bg-eco-green" : "bg-eco-gray-light"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}