import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  useAdminListPlans, 
  useAdminCreatePlan, 
  useAdminUpdatePlan,
  useAdminDeletePlan,
  getAdminListPlansQueryKey
} from "@workspace/api-client-react";
import { Plus, Edit2, Power, PowerOff, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["residential", "roam", "business"]),
  speed: z.string().min(1, "Speed is required"),
  priceMonthly: z.coerce.number().min(0),
  hardwarePrice: z.coerce.number().min(0),
  description: z.string().min(1, "Description is required"),
  features: z.string().min(1, "Features are required (comma separated)"),
  paystackPaymentLink: z.string().optional(),
  popular: z.boolean().default(false),
});

type PlanFormValues = z.infer<typeof planSchema>;

type Plan = {
  id: number;
  name: string;
  category: string;
  speed: string;
  priceMonthly: number;
  hardwarePrice?: number;
  description: string;
  features: string[];
  paystackPaymentLink?: string | null;
  popular: boolean;
  active: boolean;
};

function PlanForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues: PlanFormValues;
  onSubmit: (data: PlanFormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="roam">Roam</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="priceMonthly"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Price ($)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hardwarePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hardware Price ($)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="speed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Speed</FormLabel>
                <FormControl><Input placeholder="100-200 Mbps" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (comma separated)</FormLabel>
              <FormControl><Textarea placeholder="Unlimited data, Low latency, No contracts..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paystackPaymentLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paystack Payment Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://paystack.com/pay/..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <p className="text-[11px] text-muted-foreground mt-1">
                Paste your Paystack payment link — customers will be redirected here when they click "Get Started".
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="popular"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-bold uppercase tracking-wider">Most Popular Badge</FormLabel>
                <div className="text-sm text-muted-foreground">Highlight this plan on the pricing page</div>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" disabled={isPending} className="uppercase tracking-widest font-bold">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function AdminPlans() {
  const { data: plans, isLoading } = useAdminListPlans();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPlan = useAdminCreatePlan();
  const updatePlan = useAdminUpdatePlan();
  const deletePlan = useAdminDeletePlan();

  const handleCreate = (data: PlanFormValues) => {
    createPlan.mutate(
      {
        data: {
          ...data,
          features: data.features.split(",").map(f => f.trim()).filter(Boolean),
          paystackPaymentLink: data.paystackPaymentLink?.trim() || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListPlansQueryKey() });
          setIsCreateOpen(false);
          toast({ title: "Plan created successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create plan" });
        }
      }
    );
  };

  const handleEdit = (data: PlanFormValues) => {
    if (!editingPlan) return;
    updatePlan.mutate(
      {
        id: editingPlan.id,
        data: {
          ...data,
          features: data.features.split(",").map(f => f.trim()).filter(Boolean),
          paystackPaymentLink: data.paystackPaymentLink?.trim() || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListPlansQueryKey() });
          setEditingPlan(null);
          toast({ title: "Plan updated successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update plan" });
        }
      }
    );
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    updatePlan.mutate(
      { id, data: { active: !currentActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListPlansQueryKey() });
          toast({ title: `Plan ${!currentActive ? 'activated' : 'deactivated'}` });
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-white">Service Plans</h1>
          <p className="text-muted-foreground mt-2">Manage subscription tiers and pricing.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="uppercase tracking-widest font-bold text-xs" data-testid="button-add-plan">
              <Plus className="w-4 h-4 mr-2" /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-lg">Create New Plan</DialogTitle>
            </DialogHeader>
            <PlanForm
              defaultValues={{
                name: "",
                category: "residential",
                speed: "",
                priceMonthly: 0,
                hardwarePrice: 0,
                description: "",
                features: "",
                paystackPaymentLink: "",
                popular: false,
              }}
              onSubmit={handleCreate}
              isPending={createPlan.isPending}
              submitLabel="Save Plan"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingPlan} onOpenChange={open => { if (!open) setEditingPlan(null); }}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-lg">Edit Plan</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <PlanForm
              defaultValues={{
                name: editingPlan.name,
                category: editingPlan.category as "residential" | "roam" | "business",
                speed: editingPlan.speed,
                priceMonthly: editingPlan.priceMonthly,
                hardwarePrice: editingPlan.hardwarePrice ?? 0,
                description: editingPlan.description,
                features: editingPlan.features.join(", "),
                paystackPaymentLink: editingPlan.paystackPaymentLink ?? "",
                popular: editingPlan.popular,
              }}
              onSubmit={handleEdit}
              isPending={updatePlan.isPending}
              submitLabel="Update Plan"
            />
          )}
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="uppercase tracking-widest text-xs font-bold w-[220px]">Plan Name</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Category</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Pricing</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Payment Link</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Status</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading plans...</TableCell>
              </TableRow>
            ) : !plans || plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No plans found.</TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id} className="border-border hover:bg-white/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {plan.name}
                      {plan.popular && <Badge variant="default" className="text-[10px] px-1.5 py-0 uppercase bg-primary text-primary-foreground">Popular</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{plan.category}</TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">${plan.priceMonthly}/mo</div>
                    {plan.hardwarePrice ? <div className="text-xs text-muted-foreground">${plan.hardwarePrice} hw</div> : null}
                  </TableCell>
                  <TableCell>
                    {plan.paystackPaymentLink ? (
                      <a
                        href={plan.paystackPaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#00c3f7] hover:underline font-mono"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        Configured
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={plan.active ? 'text-green-400 border-green-400/30' : 'text-muted-foreground'}>
                      {plan.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={plan.active ? "text-orange-400 hover:text-orange-500 hover:bg-orange-400/10" : "text-green-400 hover:text-green-500 hover:bg-green-400/10"}
                        onClick={() => toggleActive(plan.id, plan.active)}
                        title={plan.active ? "Deactivate" : "Activate"}
                        data-testid={`button-toggle-plan-${plan.id}`}
                      >
                        {plan.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-white"
                        title="Edit"
                        onClick={() => setEditingPlan(plan as Plan)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
}
