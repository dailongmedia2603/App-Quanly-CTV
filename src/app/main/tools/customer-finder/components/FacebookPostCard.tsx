"use client";

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Share2, ExternalLink, Sparkles, Loader2, Copy } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type FacebookPost = Database['public']['Tables']['Bao_cao_Facebook']['Row'];

interface FacebookPostCardProps {
  post: FacebookPost;
}

export function FacebookPostCard({ post }: FacebookPostCardProps) {
  const [suggestedComment, setSuggestedComment] = useState(post.suggested_comment || '');

  const { mutate: suggestComment, isPending } = useMutation({
    mutationFn: async () => {
      const toastId = toast.loading("AI đang phân tích và tạo bình luận...");
      try {
        const { data: template, error: templateError } = await supabase
          .from("ai_prompt_templates")
          .select("prompt")
          .eq("template_type", "customer_finder_comment")
          .single();

        if (templateError || !template) {
          throw new Error("Không tìm thấy mẫu prompt cho việc tạo bình luận.");
        }

        const { data: safetyInstruction } = await supabase
          .from('ai_prompt_templates')
          .select('prompt')
          .eq('template_type', 'safety_instruction')
          .single();

        const finalPrompt = `${safetyInstruction?.prompt || ''}\n\n${template.prompt}`
          .replace('{post_content}', post.content || '')
          .replace('{keywords_found}', (post.keywords_found || []).join(', '));

        const { data, error } = await supabase.functions.invoke("generate-content", {
          body: { prompt: finalPrompt },
        });

        if (error) throw new Error(error.message);
        if (typeof data.content !== 'string') throw new Error("Nội dung trả về không hợp lệ.");

        await supabase
          .from('Bao_cao_Facebook')
          .update({ suggested_comment: data.content })
          .eq('id', post.id);
        
        await supabase.from('ai_generation_logs').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          template_type: 'customer_finder_comment',
          final_prompt: finalPrompt,
          generated_content: data.content,
        });

        toast.success("Đã tạo bình luận gợi ý thành công!", { id: toastId });
        return data.content;
      } catch (error: any) {
        toast.error(`Lỗi: ${error.message}`, { id: toastId });
        await supabase.from('ai_error_logs').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            error_message: error.message,
            function_name: 'FacebookPostCard-suggestComment',
            context: { post_id: post.id },
        });
        return null;
      }
    },
    onSuccess: (data) => {
      if (data) {
        setSuggestedComment(data);
      }
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedComment);
    toast.success("Đã sao chép bình luận!");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{post.sentiment?.charAt(0).toUpperCase() || 'N'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">Phân tích từ AI</CardTitle>
            <p className="text-xs text-muted-foreground">
              Quét lúc: {formatDistanceToNow(new Date(post.scanned_at!), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Nội dung bài viết:</h4>
            <p className="text-sm text-muted-foreground max-h-24 overflow-y-auto">
              {post.content}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Đánh giá của AI:</h4>
            <p className="text-sm text-muted-foreground">{post.ai_evaluation}</p>
          </div>
          {post.keywords_found && post.keywords_found.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Từ khóa được tìm thấy:</h4>
              <div className="flex flex-wrap gap-2">
                {post.keywords_found.map((keyword, index) => (
                  <Badge key={index} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">Bình luận gợi ý:</h4>
              <Button size="sm" onClick={() => suggestComment()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Tạo lại
              </Button>
            </div>
            <div className="relative">
              <Textarea 
                value={suggestedComment} 
                onChange={(e) => setSuggestedComment(e.target.value)}
                placeholder="Nhấn nút 'Tạo lại' để AI gợi ý bình luận..."
                className="resize-y min-h-[100px] pr-10"
              />
              {suggestedComment && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-3 flex justify-between items-center">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThumbsUp size={14} /> <span>Thích</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={14} /> <span>Bình luận</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 size={14} /> <span>Chia sẻ</span>
          </div>
        </div>
        <a href={post.source_url || '#'} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Xem bài gốc
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}