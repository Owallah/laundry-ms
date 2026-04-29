import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  pulse?: boolean;
}

export function OrderStatusBadge({ status, pulse }: OrderStatusBadgeProps) {
  const { bg, text, dot } = ORDER_STATUS_COLORS[status];
  const isActive = status === "in_progress" || status === "out_for_delivery";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
        bg,
        text
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot, {
          "dot-pulse": pulse && isActive,
        })}
      />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const { bg, text } = PAYMENT_STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium",
        bg,
        text
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
