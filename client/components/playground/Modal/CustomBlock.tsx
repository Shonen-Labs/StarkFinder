import React from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/credeza"

// Create a union type for environment
type Environment = "starknet" | "dojo";

interface CustomBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { blockName: string; cairoCode: string }) => void;
  environment: Environment;
}

export default function CustomBlock({ isOpen, onClose, onSubmit, environment }: CustomBlockModalProps) {
  // Create the form schema based on environment
  const formSchema = z.object({
    blockName: z.string().min(1, "Block name is required"),
    cairoCode: z.string().min(1, environment === "dojo" 
      ? "Dojo code is required" 
      : "Cairo code is required"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      cairoCode: "",
    },
  });

  // Handle cancel button click
  const handleCancel = () => {
    form.reset();
    onClose();
  };

  // Handle form submission
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
    form.reset();
  };

  // Get the code field label based on environment
  const getCodeFieldLabel = () => {
    return environment === "dojo" ? "Dojo Code" : "Cairo Code";
  };

  // Get the modal title based on environment
  const getModalTitle = () => {
    return environment === "dojo" 
      ? "Add a Custom Dojo Block" 
      : "Add a Custom Cairo Block";
  };

  // Get the background color based on environment
  const getBackgroundColor = () => {
    return environment === "dojo" 
      ? "bg-[#e3d5ca]"  
      : "bg-[#faf3dd]";
  };

  return (
    <Credenza open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent className={`border-white/10 ${getBackgroundColor()}`}>
        <CredenzaHeader>
          <CredenzaTitle className="text-black">{getModalTitle()}</CredenzaTitle>
          <CredenzaClose>
            <span className="sr-only">Close</span>
          </CredenzaClose>
        </CredenzaHeader>
        <CredenzaBody>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Block Name */}
              <FormField
                control={form.control}
                name="blockName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Block Name</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className="w-full p-2 rounded bg-[#d5bdaf] text-black border-2 border-[#2A2A2A] focus:border-[#4A4A4A]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Code Field */}
              <FormField
                control={form.control}
                name="cairoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">{getCodeFieldLabel()}</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="w-full p-2 rounded bg-[#d5bdaf] text-black border-2 border-[#2A2A2A] focus:border-[#4A4A4A]"
                        rows={8}
                        placeholder={environment === "dojo" 
                          ? "Enter your Dojo code here..." 
                          : "Enter your Cairo code here..."}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" 
                  className={environment === "dojo" ? "bg-white/60 hover:bg-white/50" : ""}
                >
                  Create Block
                </Button>
              </div>
            </form>
          </Form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}