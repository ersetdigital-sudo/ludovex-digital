"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "./icon";
import { PaymentDetail } from "./payment-detail";
import { DataUnavailable } from "./data-unavailable";
import { OPERATORS, type PayMethod } from "@/data/payments";
import type {
  ProductItem,
  Service,
  ServiceInputField,
} from "@/data/services";
import {
  checkVoucher,
  createBillCheck,
  createOrder,
  getPayment,
} from "@/lib/db/client";
import { SERVICE_UNAVAILABLE_MESSAGE, toPublicError } from "@/lib/db/errors";
import type { PaymentInfo, VoucherCheck, WebBrand } from "@/lib/db/types";
import { digits, maskNomor, rp } from "@/lib/format";
import { saveRef } from "@/lib/tx";

type Step = 1 | 2;
type Pending = "order" | "bill" | null;

function fieldsOf(service: Service): ServiceInputField[] {
  if (service.inputFields.length > 0) return service.inputFields;
  return [
    {
      key: "nomor",
      label: service.field,
      placeholder: service.placeholder,
      wajib: true,
    },
  ];
}

function isPhoneField(field?: ServiceInputField): boolean {
  if (!field) return false;
  return /hp|whatsapp/i.test(field.label) || (field.placeholder ?? "").startsWith("08");
}

export function TransactionFlow({
  services,
  paymentMethods,
  brand,
  fixedService = null,
  initialNo = "",
  initialVoucher = "",
}: {
  services: Service[];
  paymentMethods: PayMethod[];
  brand: WebBrand;
  fixedService?: Service | null;
  initialNo?: string;
  initialVoucher?: string;
}) {
  const firstService = fixedService ?? services[0] ?? null;
  const [svcId, setSvcId] = useState<string>(firstService?.id ?? "");
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initialService = firstService;
    const firstField = initialService ? fieldsOf(initialService)[0] : null;
    return firstField ? { [firstField.key]: initialNo } : {};
  });
  const [wa, setWa] = useState("");
  const [item, setItem] = useState<ProductItem | null>(null);
  const [pay, setPay] = useState(0);
  const [voucherInput, setVoucherInput] = useState(
    initialVoucher.trim().toUpperCase(),
  );
  const [voucher, setVoucher] = useState<string | null>(
    initialVoucher.trim().toUpperCase() || null,
  );
  const [voucherPreview, setVoucherPreview] = useState<VoucherCheck | null>(null);
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [showErr, setShowErr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [step, setStep] = useState<Step>(1);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);

  const cur: Service | null =
    fixedService ?? services.find((service) => service.id === svcId) ?? services[0] ?? null;
  const fields = cur ? fieldsOf(cur) : [];
  const primaryField = fields[0];
  const primaryValue = primaryField ? (inputs[primaryField.key] ?? "") : "";
  const method = paymentMethods[pay] ?? paymentMethods[0] ?? null;
  const waDigits = digits(wa);
  const waValid = /^08\d{8,12}$/.test(waDigits);

  const valid =
    !!cur &&
    fields.length > 0 &&
    fields.every(
      (field) =>
        !field.wajib || (inputs[field.key] ?? "").trim().length > 0,
    ) &&
    (!isPhoneField(primaryField) || digits(primaryValue).length >= 8);

  const operator = useMemo(() => {
    const isHp = cur?.id === "pulsa" || cur?.id === "data";
    let d = digits(primaryValue);
    if (d.startsWith("62")) d = "0" + d.slice(2);
    else if (d.startsWith("8")) d = "0" + d;
    if (!isHp || d.length < 4) {
      return { found: null as null | (typeof OPERATORS)[number], unknown: false };
    }
    const found = OPERATORS.find((o) => o.prefixes.includes(d.slice(0, 4))) ?? null;
    return { found, unknown: !found };
  }, [primaryValue, cur?.id]);

  const disc = voucherPreview?.valid ? voucherPreview.potongan : 0;
  const total = item ? Math.max(0, item[1] + (method?.fee ?? 0) - disc) : 0;
  const title = fixedService
    ? `${fixedService.bill ? "Bayar " : "Beli "}${fixedService.name}`
    : "Transaksi";

  /* ---------- efek ---------- */

  useEffect(() => {
    if (!voucher || !cur) {
      setVoucherPreview(null);
      setVoucherChecking(false);
      return;
    }

    let active = true;
    setVoucherChecking(true);
    checkVoucher({
      brandSlug: brand.slug,
      code: voucher,
      serviceId: cur.dbId,
      subtotal: item?.[1] ?? 0,
    })
      .then((result) => {
        if (active) setVoucherPreview(result);
      })
      .catch((err) => {
        if (active) {
          setVoucherPreview({
            valid: false,
            potongan: 0,
            pesan: toPublicError(err).message,
          });
        }
      })
      .finally(() => {
        if (active) setVoucherChecking(false);
      });

    return () => {
      active = false;
    };
  }, [voucher, cur?.dbId, item?.[1], brand.slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  /* ---------- aksi ---------- */

  const selectService = (id: string) => {
    const next = services.find((service) => service.id === id);
    if (!next) return;
    const nextFields = fieldsOf(next);
    setSvcId(id);
    setInputs(nextFields[0] ? { [nextFields[0].key]: primaryValue } : {});
    setItem(null);
    setShowErr(false);
    setError(null);
  };

  const updateInput = (key: string, value: string, phone: boolean) => {
    setInputs((current) => ({
      ...current,
      [key]: phone ? value.replace(/[^\d +]/g, "") : value,
    }));
    setShowErr(false);
    setError(null);
  };

  const applyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    setVoucherInput(code);
    setVoucher(code || null);
    if (!code) setVoucherPreview(null);
    setError(null);
  };

  const toggleVoucher = () => {
    if (voucher) {
      setVoucher(null);
      setVoucherInput("");
      setVoucherPreview(null);
    } else {
      applyVoucher();
    }
  };

  const inputPayload = () => {
    const result: Record<string, string> = {};
    fields.forEach((field) => {
      result[field.key] = (inputs[field.key] ?? "").trim();
    });
    return result;
  };

  const handleNominal = async () => {
    if (!cur || !item || !method || !valid || pending) {
      setShowErr(true);
      return;
    }
    if (!item[2]) {
      setError(SERVICE_UNAVAILABLE_MESSAGE);
      return;
    }

    setPending("order");
    setError(null);
    try {
      const created = await createOrder({
        brandSlug: brand.slug,
        serviceId: cur.dbId,
        productId: item[2],
        nomorTujuan: primaryValue.trim(),
        input: inputPayload(),
        paymentMethodId: method.id,
        voucherCode: voucherPreview?.valid ? voucher : null,
      });
      saveRef(created.ref);

      let detail: PaymentInfo;
      try {
        detail = await getPayment(created.ref);
      } catch {
        detail = {
          ref: created.ref,
          status: "menunggu_bayar",
          total: created.total,
          nama_layanan: cur.name,
          nama_produk: item[0],
          nomor_tujuan: maskNomor(primaryValue.trim()),
          metode_bayar: method.name,
          tipe_metode:
            method.type === "ew" ? "ewallet" : method.type,
          biaya_admin: method.fee,
          potongan: disc,
          voucher_kode: voucherPreview?.valid ? voucher : null,
          qris_image_url: brand.qris_image_url,
          logo_url: brand.logo_url,
          nama_brand: brand.nama,
          wa_cs: brand.wa_cs,
          expires_at: created.expires_at,
          jam_cek_tagihan: brand.jam_cek_tagihan,
          nominal_tagihan: null,
          denda: 0,
          created_at: new Date().toISOString(),
        };
      }

      setPayment(detail);
      setStep(2);
    } catch (err) {
      setError(toPublicError(err).message);
    } finally {
      setPending(null);
    }
  };

  const handleBill = async () => {
    if (!cur || !method || !valid || !waValid || pending) {
      setShowErr(true);
      return;
    }

    setPending("bill");
    setError(null);
    try {
      const created = await createBillCheck({
        brandSlug: brand.slug,
        serviceId: cur.dbId,
        nomorTujuan: primaryValue.trim(),
        input: inputPayload(),
        waPembeli: waDigits,
        paymentMethodId: method.id,
        voucherCode: voucherPreview?.valid ? voucher : null,
      });
      saveRef(created.ref);

      let detail: PaymentInfo;
      try {
        detail = await getPayment(created.ref);
      } catch {
        detail = {
          ref: created.ref,
          status: "menunggu_cek",
          total: null,
          nama_layanan: cur.name,
          nama_produk: null,
          nomor_tujuan: maskNomor(primaryValue.trim()),
          metode_bayar: method.name,
          tipe_metode:
            method.type === "ew" ? "ewallet" : method.type,
          biaya_admin: method.fee,
          potongan: 0,
          voucher_kode: voucherPreview?.valid ? voucher : null,
          qris_image_url: brand.qris_image_url,
          logo_url: brand.logo_url,
          nama_brand: brand.nama,
          wa_cs: brand.wa_cs,
          expires_at: null,
          jam_cek_tagihan: created.jam_cek_tagihan ?? brand.jam_cek_tagihan,
          nominal_tagihan: null,
          denda: 0,
          created_at: new Date().toISOString(),
        };
      }

      setPayment(detail);
      setStep(2);
    } catch (err) {
      setError(toPublicError(err).message);
    } finally {
      setPending(null);
    }
  };

  const vMsg = (() => {
    if (voucherChecking) return { cls: "text-[#6b7394]", text: "Memeriksa voucher…" };
    if (!voucher || !voucherPreview) return null;
    if (!voucherPreview.valid) {
      return { cls: "text-red-500", text: voucherPreview.pesan };
    }
    if (!item) {
      return {
        cls: "text-[#6b7394]",
        text: `Voucher ${voucher} dipasang. Pilih produk untuk melihat potongan.`,
      };
    }
    if (voucherPreview.potongan > 0) {
      return { cls: "text-[#16835e] font-semibold", text: `✓ ${voucherPreview.pesan}` };
    }
    return { cls: "text-[#c25a17]", text: voucherPreview.pesan };
  })();

  const invalidMessage = isPhoneField(primaryField)
    ? "Mohon isi nomor dengan benar (min. 8 digit)."
    : "Mohon lengkapi data pembeli.";
  const stepCls = (i: number) => "step" + (step > i ? " done" : step === i ? " on" : "");
  const ctaLabel =
    pending === "order"
      ? "Memproses…"
      : pending === "bill"
        ? "Mengecek…"
        : cur?.bill
          ? "Cek Tagihan"
          : "Lanjut ke Pembayaran";
  const ctaDisabled =
    pending !== null ||
    voucherChecking ||
    !valid ||
    !method ||
    (cur?.bill ? !waValid : !item);

  if (!cur) {
    return (
      <main className="max-w-6xl mx-auto px-5 py-8 md:py-12">
        <DataUnavailable message="Belum ada layanan aktif saat ini." />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 md:py-12">
      {/* judul */}
      <div className="flex items-center gap-4">
        {fixedService && (
          <span className={`rounded-2xl p-3 w-14 h-14 shrink-0 t-${fixedService.tone}`}>
            <Icon name={fixedService.icon} />
          </span>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">{title}</h1>
          {fixedService && (
            <Link href="/#layanan" className="text-sm font-semibold text-[#3b4fd8]">
              ← Ganti layanan
            </Link>
          )}
        </div>
      </div>

      {/* stepper */}
      <div className="mt-6 card px-5 py-4 flex items-center gap-3">
        <div className={stepCls(1)}>
          <span className="n">{step > 1 ? "✓" : 1}</span>
          <span className="hidden sm:inline">Isi data</span>
        </div>
        <div className={"bar" + (step > 1 ? " done" : "")} />
        <div className={stepCls(2)}>
          <span className="n">2</span>
          <span className="hidden sm:inline">Pembayaran</span>
        </div>
        <div className={"bar" + (step > 2 ? " done" : "")} />
        <div className={stepCls(3)}>
          <span className="n">3</span>
          <span className="hidden sm:inline">Verifikasi</span>
        </div>
      </div>

      {/* ============================ LANGKAH 1 ============================ */}
      {step === 1 && (
        <section className="mt-6">
          {!fixedService && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className={`opt py-2 px-4 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
                    s.id === cur.id ? "active" : ""
                  }`}
                >
                  <Icon name={s.icon as IconName} className="w-5 h-5" />
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* form */}
            <div className="card p-6 md:p-8 space-y-7">
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const phone = isPhoneField(field);
                  return (
                    <div key={field.key}>
                      <label htmlFor={`input-${field.key}`} className="font-bold block mb-2">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          id={`input-${field.key}`}
                          className={`field ${index === 0 && operator.found ? "pr-36" : ""}`}
                          inputMode={phone ? "numeric" : "text"}
                          value={inputs[field.key] ?? ""}
                          onChange={(e) =>
                            updateInput(field.key, e.target.value, phone)
                          }
                          placeholder={field.placeholder ?? ""}
                        />
                        {index === 0 && operator.found && (
                          <span
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white"
                            style={{
                              background: operator.found.color,
                              color:
                                operator.found.name === "Indosat" ? "#16204a" : "#fff",
                            }}
                          >
                            <span className="w-4 h-4 rounded-full bg-white/30 grid place-items-center text-[9px]">
                              {operator.found.name[0]}
                            </span>
                            {operator.found.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {operator.unknown && (
                  <p className="text-xs text-[#6b7394]">
                    Operator tidak dikenali, periksa kembali nomor HP.
                  </p>
                )}
                <p
                  className={`text-red-500 text-sm ${showErr && !valid ? "" : "hidden"}`}
                >
                  {invalidMessage}
                </p>

                {cur.bill && (
                  <div>
                    <label htmlFor="wa" className="font-bold block mb-2">
                      Nomor WhatsApp aktif
                    </label>
                    <input
                      id="wa"
                      className="field"
                      inputMode="tel"
                      value={wa}
                      onChange={(e) => {
                        setWa(e.target.value.replace(/[^\d +]/g, ""));
                        setShowErr(false);
                        setError(null);
                      }}
                      placeholder="08xx xxxx xxxx"
                    />
                    <p className="text-xs text-[#6b7394] mt-2">
                      Admin akan mengirim total tagihan dan link pembayaran ke nomor ini.
                    </p>
                    <p
                      className={`text-red-500 text-sm mt-2 ${
                        showErr && !waValid ? "" : "hidden"
                      }`}
                    >
                      Masukkan nomor WhatsApp aktif dengan format 08xx.
                    </p>
                  </div>
                )}
              </div>

              {/* nominal / cek tagihan */}
              <div>
                <div className="font-bold mb-3">
                  {cur.bill ? "Cek tagihan" : "Pilih nominal"}
                </div>
                {cur.bill ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleBill}
                      disabled={ctaDisabled}
                      className="btn btn-ghost col-span-2"
                    >
                      {pending === "bill" ? "Mengecek…" : "Cek Tagihan"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {cur.items && cur.items.length > 0 ? (
                      cur.items.map((it) => (
                        <button
                          key={it[0]}
                          type="button"
                          onClick={() => {
                            setItem(it);
                            setError(null);
                          }}
                          className={`opt ${item?.[0] === it[0] ? "active" : ""}`}
                        >
                          <div className="font-semibold">{it[0]}</div>
                          <div className="text-[#3b4fd8] font-bold mt-1">{rp(it[1])}</div>
                        </button>
                      ))
                    ) : (
                      <p className="col-span-2 text-sm text-[#6b7394]">
                        Belum ada nominal aktif untuk layanan ini.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* metode bayar */}
              <div>
                <div className="font-bold mb-3">Metode pembayaran</div>
                {paymentMethods.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentMethods.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPay(i);
                          setError(null);
                        }}
                        className={`opt ${i === pay ? "active" : ""}`}
                      >
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-[#6b7394]">
                          {p.fee ? `Admin ${rp(p.fee)}` : "Gratis admin"}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6b7394]">
                    Belum ada metode pembayaran aktif.
                  </p>
                )}
              </div>
            </div>

            {/* ringkasan */}
            <aside className="card p-6 lg:sticky lg:top-24">
              <div className="font-bold text-lg">Ringkasan</div>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Layanan" value={cur.name} />
                {fields.map((field) => (
                  <Row
                    key={field.key}
                    label={field.label}
                    value={inputs[field.key] || "-"}
                  />
                ))}
                {cur.bill && <Row label="WhatsApp" value={wa || "-"} />}
                <Row label="Produk" value={item ? item[0] : "-"} alignRight />
                <Row label="Metode" value={method?.name ?? "-"} />
                <Row
                  label="Biaya admin"
                  value={method ? rp(method.fee) : "-"}
                />
              </div>

              <div className="mt-5">
                <label htmlFor="voucher" className="text-sm font-bold block mb-2">
                  Kode voucher
                </label>
                <div className="flex gap-2">
                  <input
                    id="voucher"
                    className="field py-2.5 text-sm uppercase font-mono"
                    placeholder="Contoh: LUDOBARU"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        toggleVoucher();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleVoucher}
                    disabled={voucherChecking || pending !== null}
                    className="btn btn-ghost py-2 px-4 text-sm shrink-0"
                  >
                    {voucher ? "Hapus" : "Pakai"}
                  </button>
                </div>
                {vMsg && <p className={`text-xs mt-2 ${vMsg.cls}`}>{vMsg.text}</p>}
              </div>

              {!cur.bill && disc > 0 && (
                <div className="mt-3 text-sm flex justify-between">
                  <span className="text-[#16835e] font-semibold">Diskon voucher</span>
                  <b className="text-[#16835e]">-{rp(disc)}</b>
                </div>
              )}

              <div className="border-t border-dashed border-[#d9dcf0] my-5" />
              <div className="flex justify-between items-end">
                <span className="text-[#6b7394]">Total</span>
                <span className="text-2xl font-extrabold text-[#3b4fd8]">
                  {cur.bill ? "Dihitung admin" : rp(total)}
                </span>
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={cur.bill ? handleBill : handleNominal}
                disabled={ctaDisabled}
                className="btn w-full mt-6"
              >
                {ctaLabel}
              </button>
              <p className="text-xs text-[#6b7394] mt-3 text-center">
                Pembayaran manual, bukti dikirim lewat WhatsApp dan dicek admin.
              </p>
            </aside>
          </div>
        </section>
      )}

      {/* ============================ LANGKAH 2 ============================ */}
      {step === 2 && payment && (
        <section className="mt-6">
          <PaymentDetail payment={payment} />
        </section>
      )}
    </main>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
  accent,
  accentGreen,
  alignRight,
  big,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  mono?: boolean;
  accent?: boolean;
  accentGreen?: boolean;
  alignRight?: boolean;
  big?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#6b7394] shrink-0">{label}</span>
      <span
        className={[
          bold ? "font-semibold" : "",
          mono ? "font-mono" : "",
          accent ? "text-[#3b4fd8]" : "",
          accentGreen ? "text-[#16835e]" : "",
          big ? "text-lg font-extrabold" : "",
          alignRight ? "text-right" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
