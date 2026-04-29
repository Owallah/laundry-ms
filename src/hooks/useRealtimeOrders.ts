"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types";

/**
 * Subscribes to real-time order changes for the current day.
 * Returns the latest orders list, a loading flag, and a manual refresh function.
 */
export function useRealtimeOrders(initialOrders: Order[] = []) {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers(name, phone),
        service_type:service_types(name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Set up Supabase Realtime channel
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          // Re-fetch on any change (INSERT, UPDATE, DELETE)
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchOrders]);

  return { orders, loading, refresh: fetchOrders };
}
