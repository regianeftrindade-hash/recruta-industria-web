import { redirect } from 'next/navigation';

export default function AdminSupabaseRedirect() {
  redirect('/admin/servicos');
}
