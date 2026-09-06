import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { violationRepository } from '@/repositories/violation.repository';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const { items } = body; // Array of PendingSyncViolation

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Senkronize edilecek kayıt bulunamadı.', 'EMPTY_PAYLOAD', 400);
    }

    const syncedResults = [];
    const failedResults = [];

    for (const item of items) {
      try {
        const res = await violationRepository.createViolation({
          student_id: item.student_id,
          teacher_id: user.userId,
          type: item.type,
          note: item.note,
          date: item.date,
          time: item.time,
          client_transaction_id: item.client_transaction_id,
          allow_duplicate: true, // Offline records were already confirmed by teacher
        });

        syncedResults.push({
          client_transaction_id: item.client_transaction_id,
          violation_id: res.violation?.id,
          alreadySynced: res.alreadySynced,
        });
      } catch (err: any) {
        failedResults.push({
          client_transaction_id: item.client_transaction_id,
          error: err.message || 'Senkronizasyon hatası',
        });
      }
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'OFFLINE_SYNC_COMPLETED',
      entityType: 'VIOLATION',
      ipAddress: ip,
      userAgent: userAgent,
      newValue: {
        syncedCount: syncedResults.length,
        failedCount: failedResults.length,
      },
    });

    return successResponse({
      synced: syncedResults,
      failed: failedResults,
      syncedCount: syncedResults.length,
      failedCount: failedResults.length,
    }, `${syncedResults.length} adet çevrimdışı kayıt başarıyla senkronize edildi.`);
  } catch (error) {
    console.error('Sync POST error:', error);
    return errorResponse('Senkronizasyon sırasında hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
