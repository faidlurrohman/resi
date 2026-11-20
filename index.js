import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { getCSRFData, encryptTimers, getResiTracking } from "./function.js";

const app = new Hono();

app.get("/resi/:courier/:number", async (c) => {
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

app.get("/", (c) => {
  return c.json({
    status: 200,
    author: "Hamburger",
    message: "Selamat datang di API Cek Resi Indonesia.",
    usage: "GET /resi/:courier/:number (Contoh: /resi/TIKI/660077779123)",
  });
});

app.notFound((c) =>
  c.json({ error: "Halaman yang kamu akses tidak ada" }, 404),
);
app.onError((c) => c.json({ error: "Terjadi kesalahan pada server" }, 500));

const port = 3000;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
