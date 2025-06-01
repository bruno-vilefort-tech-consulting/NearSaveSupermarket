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
                  ? "bg-green-500 border-green-500 text-white" 
                  : isCurrent
                  ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                  : "bg-gray-100 border-gray-300 text-gray-400"
                }
              `}
            >
              {isCompleted ? (
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
                  ${isCompleted ? "bg-green-500" : "bg-gray-200"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}