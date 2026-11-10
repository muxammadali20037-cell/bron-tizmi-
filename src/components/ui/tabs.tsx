"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Yorliqlar (Radix Tabs): o‘q tugmalari bilan almashtiriladi, ARIA avtomatik. */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("bg-muted inline-flex h-11 items-center gap-1 rounded-xl p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "text-muted-foreground inline-flex h-full items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
        "hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 focus:outline-none", className)} {...props} />;
}
