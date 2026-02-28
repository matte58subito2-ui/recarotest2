import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
    const session = await getSession();
    const guestLeadCookie = cookies().get('guest_lead')?.value;

    // If not logged in and no guest lead, redirect to login
    if (!session && !guestLeadCookie) {
        redirect('/login');
    }

    return <HomeClient role={session?.role} />;
}
