import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile } from "@shared/schema";
import { useCreateProfile } from "@/hooks/use-profiles";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function CreateProfileDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createProfile = useCreateProfile();

  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: "",
      serviceType: "",
      description: "",
      location: "",
    },
  });

  const onSubmit = async (data: InsertProfile) => {
    try {
      await createProfile.mutateAsync(data);
      toast({
        title: "Profile created!",
        description: "Your service profile has been added to the directory.",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Failed to create profile",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-medium"
          size="lg"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          List a Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0 rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-background -z-10" />
        
        <div className="p-6 sm:p-8 pt-8 relative z-10">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold font-display">Create Provider Profile</DialogTitle>
            <DialogDescription className="text-base">
              Offer your skills to the community. People can discover you through natural language search.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground/80">Provider Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Jane Doe or Apex Repairs" 
                        className="bg-secondary/30 focus-visible:bg-transparent h-12 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/80">Service Category</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Tailoring, Plumbing..." 
                          className="bg-secondary/30 focus-visible:bg-transparent h-12 rounded-xl"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/80">Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Downtown, NY" 
                          className="bg-secondary/30 focus-visible:bg-transparent h-12 rounded-xl"
                          {...field} 
                        />
                      </FormControl>
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
                    <FormLabel className="font-semibold text-foreground/80">Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what you do. E.g. 'I can hem pants, fix prom dresses, and tailor suits perfectly.'" 
                        className="resize-none min-h-[120px] bg-secondary/30 focus-visible:bg-transparent rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Be descriptive! AI search will use this to match you with customers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={createProfile.isPending}
                  className="w-full sm:w-auto rounded-xl px-8"
                >
                  {createProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createProfile.isPending ? "Creating..." : "Publish Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
