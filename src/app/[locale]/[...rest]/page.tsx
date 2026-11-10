import { notFound } from "next/navigation";

/** Mavjud bo‘lmagan har qanday manzil tarjima qilingan 404 sahifasini ko‘rsatadi. */
export default function CatchAllPage() {
  notFound();
}
