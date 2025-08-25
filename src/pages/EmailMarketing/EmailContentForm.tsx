"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên nội dung là bắt buộc." }),
  subject: z.string().optional(),
  body: z.string().optional(),
  service_id: z.string().uuid().nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
});

type EmailContentFormValues = z.infer<typeof formSchema>;

interface Service {
  id: string;
  name: string;
}

interface EmailContentGroup {
  id: string;
  name: string;
}

export default function EmailContentForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<EmailContentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<EmailContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      service_id: null,
      group_id: null,
    },
  });

  useEffect(() => {
    async function fetchDependencies() {
      setLoading(true);
      const { data: servicesData, error: servicesError } = await supabase
        .from("document_services")
        .select("id, name");

      const { data: groupsData, error: groupsError } = await supabase
        .from("email_content_groups")
        .select("id, name");

      if (servicesError) {
        console.error("Error fetching services:", servicesError);
        toast.error("Lỗi khi tải danh sách dịch vụ.");
      } else {
        setServices(servicesData || []);
      }

      if (groupsError) {
        console.error("Error fetching groups:", groupsError);
        toast.error("Lỗi khi tải danh sách nhóm nội dung.");
      } else {
        setGroups(groupsData || []);
      }
      setLoading(false);
    }

    fetchDependencies();
  }, []);

  async function onSubmit(values: EmailContentFormValues) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      toast.error("Bạn cần đăng nhập để tạo nội dung email.");
      return;
    }

    const { data, error } = await supabase
      .from("email_contents")
      .insert({
        user_id: user.data.user.id,
        name: values.name,
        subject: values.subject,
        body: values.body,
        service_id: values.service_id,
        group_id: values.group_id,
      });

    if (error) {
      console.error("Error creating email content:", error);
      toast.error("Lỗi khi tạo nội dung email: " + error.message);
    } else {
      toast.success("Tạo nội dung email thành công!");
      form.reset();
      // Optionally redirect or update UI
    }
  }

  if (loading) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Tạo Nội Dung Email Mới</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên Nội Dung</FormLabel>
                <FormControl>
                  <Input placeholder="Tên nội dung email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiêu Đề Email</FormLabel>
                <FormControl>
                  <Input placeholder="Tiêu đề email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nội Dung Email</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nội dung chính của email"
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dịch Vụ Liên Quan (Tùy chọn)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "" ? null : value)}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Không chọn dịch vụ</SelectItem>
                    {services.map((service) => (
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
            name="group_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nhóm Nội Dung (Tùy chọn)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "" ? null : value)}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhóm nội dung" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Không chọn nhóm</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Tạo Nội Dung Email</Button>
        </form>
      </Form>
    </div>
  );
}