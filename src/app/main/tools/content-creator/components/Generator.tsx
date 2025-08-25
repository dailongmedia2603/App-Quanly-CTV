"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Database } from "@/types/supabase";

type Service = Database['public']['Tables']['document_services']['Row'];
type PostType = Database['public']['Tables']['document_post_types']['Row'];

const formSchema = z.object({
  service_id: z.string().uuid("Vui lòng chọn dịch vụ."),
  post_type_id: z.string().uuid("Vui lòng chọn loại bài viết."),
  prompt: z.string().min(10, "Yêu cầu cần có ít nhất 10 ký tự."),
});

interface GeneratorProps {
  templateType: 'post' | 'comment';
  onGeneratedContent: (content: string) => void;
}

export function Generator({ templateType, onGeneratedContent }: GeneratorProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["document_services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_services").select("*");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: postTypes, isLoading: isLoadingPostTypes } = useQuery({
    queryKey: ["document_post_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_post_types").select("*");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { mutate: generate, isPending: isGenerating } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const toastId = toast.loading("AI đang xử lý yêu cầu của bạn...");

      try {
        const { data: template, error: templateError } = await supabase
          .from("ai_prompt_templates")
          .select("prompt")
          .eq("template_type", templateType)
          .single();

        if (templateError || !template) {
          throw new Error(`Không tìm thấy mẫu prompt cho: ${templateType}`);
        }
        
        const { data: safetyInstruction } = await supabase
          .from('ai_prompt_templates')
          .select('prompt')
          .eq('template_type', 'safety_instruction')
          .single();

        const serviceInfo = services?.find(s => s.id === values.service_id)?.description || '';
        const postTypeInfo = postTypes?.find(p => p.id === values.post_type_id)?.description || '';

        const finalPrompt = `${safetyInstruction?.prompt || ''}\n\n${template.prompt}`
          .replace('{service_info}', serviceInfo)
          .replace('{post_type_info}', postTypeInfo)
          .replace('{user_prompt}', values.prompt);

        const { data, error } = await supabase.functions.invoke("generate-content", {
          body: { prompt: finalPrompt },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (typeof data.content !== 'string') {
          throw new Error("Nội dung trả về không hợp lệ.");
        }

        await supabase.from('ai_generation_logs').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          template_type: templateType,
          final_prompt: finalPrompt,
          generated_content: data.content,
        });

        toast.success("AI đã tạo nội dung thành công!", { id: toastId });
        return data.content;
      } catch (error: any) {
        toast.error(`Lỗi: ${error.message}`, { id: toastId });
        await supabase.from('ai_error_logs').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            error_message: error.message,
            function_name: `Generator-${templateType}`,
            context: { values },
        });
        return null;
      }
    },
    onSuccess: (content) => {
      if (content) {
        onGeneratedContent(content);
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    generate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dịch vụ</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingServices}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dịch vụ..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="post_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại bài viết</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingPostTypes}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại bài viết..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {postTypes?.map((postType) => (
                      <SelectItem key={postType.id} value={postType.id}>
                        {postType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yêu cầu của bạn</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ví dụ: Viết một bài viết về lợi ích của dịch vụ SEO cho doanh nghiệp nhỏ..."
                  className="resize-y min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isGenerating} className="w-full">
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tạo nội dung
        </Button>
      </form>
    </Form>
  );
}