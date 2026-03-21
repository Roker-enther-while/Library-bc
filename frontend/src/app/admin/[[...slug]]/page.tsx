import AdminPageContent from '@/page/admin/AdminPageContent';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
    // Extract slug from catch-all params
    const resolvedParams = await params;
    const slug = resolvedParams.slug?.[0] || '';

    return <AdminPageContent slug={slug} />;
}
