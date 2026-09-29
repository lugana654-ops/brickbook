"use client";

import { ProductionProvider } from "@/context/ProductionContext";
import { CustomersProvider } from "@/context/CustomersContext";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProductionProvider>
      <CustomersProvider>{children}</CustomersProvider>
    </ProductionProvider>
  );
}
