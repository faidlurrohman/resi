import { Hono } from "hono";
import { handle } from "@hono/vercel";
import { getCSRFData, encryptTimers, getResiTracking } from "../function.js";

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "https://primatrans.id");
  c.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  await next();
});

app.get("/api/resi/:courier/:number", async (c) => {
  const courier = c.req.param("courier").toUpperCase();
  const number = c.req.param("number");

  if (!number || number.trim() === "") {
    return c.json({ error: "Nomor resi tidak boleh kosong" }, 400);
  }

  const validCouriers = [
    "JET",
    "TIKI",
    "LION",
    "JNE",
    "POS",
    "SICEPAT",
    "ANTEAJA",
  ];
  if (!validCouriers.includes(courier)) {
    return c.json(
      {
        error: `Kode kurir tidak valid. Gunakan: ${validCouriers.join(", ")}`,
      },
      400,
    );
  }

  try {
    const csrf = await getCSRFData(number);
    const timers = await encryptTimers(number);
    const trackingData = await getResiTracking(number, csrf, timers, courier);

    return c.json({ status: 200, data: trackingData });
  } catch (error) {
    console.error("Error:", error.message);
    return c.json({
      status: 500,
      message: "Terjadi kesalahan saat memproses resi",
      detail: error.message,
    });
  }
});

app.get("/api", (c) => {
  return c.json({
    status: 200,
    author: "Hamburger",
    message: "Selamat datang di API Cek Resi Indonesia.",
    usage: "GET /resi/:courier/:number (Contoh: /resi/TIKI/660077779123)",
  });
});

// Export handler untuk Vercel
export const GET = handle(app);
export const POST = handle(app); // Jika nanti butuh POST
export const OPTIONS = handle(app);
