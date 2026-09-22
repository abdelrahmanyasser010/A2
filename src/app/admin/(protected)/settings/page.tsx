import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";
import { getSettings } from "@/server/store-db";
export const dynamic="force-dynamic";
export default async function SettingsPage(){return <AdminSettingsClient initial={await getSettings()}/>}
