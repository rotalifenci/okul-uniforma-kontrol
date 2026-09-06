import { clearAuthCookie } from '@/lib/auth';
import { successResponse } from '@/lib/response';

export async function POST() {
  clearAuthCookie();
  return successResponse(null, 'Çıkış yapıldı.');
}
