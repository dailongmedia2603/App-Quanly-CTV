// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm tính toán thời gian quét tiếp theo
const calculateNextScan = (lastScan: Date, frequency: number, unit: string): Date => {
    const nextScan = new Date(lastScan.getTime());
    switch (unit) {
        case 'minute':
            nextScan.setMinutes(nextScan.getMinutes() + frequency);
            break;
        case 'hour':
            nextScan.setHours(nextScan.getHours() + frequency);
            break;
        case 'day':
            nextScan.setDate(nextScan.getDate() + frequency);
            break;
        default: // Mặc định là giờ nếu đơn vị không xác định
            nextScan.setHours(nextScan.getHours() + frequency);
            break;
    }
    return nextScan;
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    console.log("Hàm lập lịch được đánh thức, bắt đầu kiểm tra...");

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const now = new Date();
        const nowISO = now.toISOString();

        // Lấy tất cả các chiến dịch đến hạn quét trực tiếp từ DB
        const { data: campaignsToRun, error } = await supabaseAdmin
            .from('danh_sach_chien_dich')
            .select('*')
            .eq('status', 'active')
            .or(`end_date.is.null,end_date.gt.${nowISO}`)
            .or(`next_scan_at.is.null,next_scan_at.lte.${nowISO}`);

        if (error) {
            throw new Error(`Lỗi khi lấy danh sách chiến dịch đến hạn: ${error.message}`);
        }

        if (!campaignsToRun || campaignsToRun.length === 0) {
            const message = "Kiểm tra hoàn tất. Không có chiến dịch nào đến hạn quét. Bỏ qua.";
            console.log(message);
            return new Response(JSON.stringify({ message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        console.log(`Tìm thấy ${campaignsToRun.length} chiến dịch cần quét. Bắt đầu xử lý...`);

        for (const campaign of campaignsToRun) {
            console.log(`Đang xử lý chiến dịch: ${campaign.name} (${campaign.id})`);

            const scanFunctionsToCall = [];
            if (campaign.type === 'Facebook' || campaign.type === 'Tổng hợp') {
                scanFunctionsToCall.push('scan-facebook-campaign');
            }

            if (scanFunctionsToCall.length > 0) {
                for (const scanFunctionName of scanFunctionsToCall) {
                    try {
                        console.log(`Calling ${scanFunctionName} for campaign ${campaign.id}`);
                        const { error: invokeError } = await supabaseAdmin.functions.invoke(scanFunctionName, {
                            body: { campaign_id: campaign.id },
                        });
                        if (invokeError) {
                            console.error(`Lỗi khi gọi ${scanFunctionName} cho chiến dịch ${campaign.id}:`, invokeError.message);
                        } else {
                            console.log(`Đã gọi ${scanFunctionName} thành công cho chiến dịch ${campaign.id}.`);
                        }
                    } catch (e) {
                        console.error(`Lỗi không mong muốn khi gọi ${scanFunctionName} cho chiến dịch ${campaign.id}:`, e.message);
                    }
                }
            } else {
                 console.log(`Bỏ qua chiến dịch '${campaign.name}' loại '${campaign.type}' vì chưa có chức năng quét.`);
            }

            // Luôn cập nhật thời gian quét tiếp theo để tránh vòng lặp vô hạn khi quét lỗi
            const nextScanAt = calculateNextScan(new Date(), campaign.scan_frequency, campaign.scan_unit);
            const { error: updateError } = await supabaseAdmin
                .from('danh_sach_chien_dich')
                .update({ next_scan_at: nextScanAt.toISOString() })
                .eq('id', campaign.id);

            if (updateError) {
                console.error(`Cập nhật next_scan_at thất bại cho chiến dịch ${campaign.id}:`, updateError.message);
            } else {
                console.log(`Đã cập nhật next_scan_at cho chiến dịch ${campaign.id} thành ${nextScanAt.toISOString()}`);
            }
        }
        
        const successMessage = `Đã xử lý xong ${campaignsToRun.length} chiến dịch.`;
        console.log(successMessage);
        return new Response(JSON.stringify({ success: true, message: successMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Hàm lập lịch thất bại:", error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});