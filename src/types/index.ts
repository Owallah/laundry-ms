// ============================================================
// DATABASE TYPES
// ============================================================

export type OrderStatus =
  | "received"
  | "in_progress"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "mpesa";
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";
export type StaffRole = "admin" | "manager" | "attendant" | "driver";
export type ShiftStatus = "scheduled" | "active" | "completed" | "absent";
export type InventoryCategory =
  | "detergent"
  | "softener"
  | "bleach"
  | "packaging"
  | "equipment"
  | "other";
export type InventoryUnit = "kg" | "litres" | "pieces" | "rolls" | "boxes";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: StaffRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  price_per_kg: number;
  turnaround_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  service_type_id: string;
  status: OrderStatus;
  weight_kg: number;
  price_per_kg: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  notes: string | null;
  special_instructions: string | null;
  received_by: string | null;
  assigned_to: string | null;
  pickup_date: string | null;
  pickup_time_slot: string | null;
  delivery_address: string | null;
  is_delivery: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: Customer;
  service_type?: ServiceType;
  assigned_staff?: Profile;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  mpesa_transaction_id: string | null;
  mpesa_phone: string | null;
  mpesa_receipt_number: string | null;
  mpesa_checkout_request_id: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  customer?: Customer;
}

export interface Shift {
  id: string;
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  clock_in: string | null;
  clock_out: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  staff?: Profile;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number | null;
  supplier: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: "restock" | "usage" | "adjustment" | "waste";
  quantity: number;
  balance_after: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  item?: InventoryItem;
  recorder?: Profile;
}

// ============================================================
// API / FORM TYPES
// ============================================================

export interface CreateOrderInput {
  customer_id: string;
  service_type_id: string;
  weight_kg: number;
  discount?: number;
  notes?: string;
  special_instructions?: string;
  pickup_date?: string;
  pickup_time_slot?: string;
  is_delivery?: boolean;
  delivery_address?: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CreatePaymentInput {
  order_id: string;
  customer_id: string;
  amount: number;
  method: PaymentMethod;
  mpesa_phone?: string;
  notes?: string;
}

export interface CreateShiftInput {
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface InventoryTransactionInput {
  item_id: string;
  type: "restock" | "usage" | "adjustment" | "waste";
  quantity: number;
  unit_cost?: number;
  reference?: string;
  notes?: string;
}

// ============================================================
// DASHBOARD / ANALYTICS
// ============================================================

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  activeOrders: number;
  readyOrders: number;
  weekRevenue: number;
  monthRevenue: number;
  totalCustomers: number;
  lowStockItems: number;
}

export interface RevenueDataPoint {
  day: string;
  cash: number;
  mpesa: number;
  total: number;
}

export interface OrderStatusBreakdown {
  status: OrderStatus;
  count: number;
  total_value: number;
}

// ============================================================
// MPESA
// ============================================================

export interface MpesaStkPushRequest {
  phone: string;
  amount: number;
  order_id: string;
  account_reference: string;
}

export interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}
