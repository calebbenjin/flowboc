import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/booking-page?tab=content");
}
