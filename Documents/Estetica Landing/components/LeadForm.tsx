"use client";

import { useState, useEffect, useRef } from "react";

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
  ctaText: string;
}

export default function LeadForm({ open, onClose, ctaText }: LeadFormProps) {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      document.body.style.overflow = "hidden";
      setTimeout(() => nameRef.current?.focus(), 350);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    setFirstName(name.split(" ")[0] || "gracias");
    setLoading(true);
    try {
      const res = await fetch("https://godkeys-n8n.djq22s.easypanel.host/webhook/clinica-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: name, telefono: phone }),
      });
      if (res.ok) {
        const data = await res.json();
        const leadId = data?.lead_id;
        window.location.href = `https://estetica-crm.vercel.app/agendar${leadId ? `?lead_id=${leadId}` : ""}`;
        return;
      }
    } catch {
      // fetch fallido — mostrar confirmacion y redirigir sin lead_id
    }
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      window.location.href = "https://estetica-crm.vercel.app/agendar";
    }, 1800);
  }

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,5,12,0.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 460,
          background: "var(--bg-modal)",
          border: "1px solid rgba(255,255,255,0.14)",
          padding: "40px 34px 38px",
          position: "relative",
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "modalIn .4s cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute", top: 18, right: 18,
            width: 34, height: 34,
            border: "none", background: "transparent",
            color: "var(--txt-3)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} noValidate>
            <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, color: "var(--white)", fontSize: 30, lineHeight: 1.1, marginBottom: 10, paddingRight: 20 }}>
              Agenda tu evaluación gratuita
            </h3>
            <p style={{ color: "var(--txt-2)", fontSize: 14, marginBottom: 28, fontWeight: 300 }}>
              Sin costo · Sin compromiso · Solo 2 minutos.
            </p>

            <Field label="Nombre completo">
              <input ref={nameRef} type="text" name="name" placeholder="Tu nombre" required />
            </Field>
            <Field label="Teléfono">
              <input type="tel" name="phone" placeholder="+56 9 ____ ____" required />
            </Field>
            <Field label="¿Has realizado algún tratamiento antes?" isSelect>
              <select name="prev" required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>No, sería mi primera vez</option>
                <option>Sí, tratamientos faciales</option>
                <option>Sí, otros tratamientos estéticos</option>
              </select>
            </Field>
            <Field label="¿Cuál es tu principal objetivo?" isSelect>
              <select name="goal" required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>Recuperar firmeza</option>
                <option>Reducir líneas y arrugas</option>
                <option>Mejorar luminosidad</option>
                <option>Definir el contorno facial</option>
              </select>
            </Field>
            <Field label="¿Cuándo quieres comenzar?" isSelect>
              <select name="when" required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>Lo antes posible</option>
                <option>Dentro de las próximas semanas</option>
                <option>Solo estoy informándome</option>
              </select>
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 12, width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
                letterSpacing: "0.16em", textTransform: "uppercase",
                background: "transparent", cursor: loading ? "not-allowed" : "pointer",
                padding: "18px 34px", border: "2px solid var(--white)",
                color: "var(--white)", borderRadius: 0,
                opacity: loading ? 0.6 : 1,
                transition: "background-color .35s ease, color .35s ease, opacity .2s ease",
              }}
              onMouseEnter={(e) => { if (!loading) { const b = e.currentTarget; b.style.background = "var(--white)"; b.style.color = "var(--bg)"; } }}
              onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = "transparent"; b.style.color = "var(--white)"; }}
            >
              {loading ? "Procesando..." : ctaText}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "14px 0 6px", animation: "fadeUp .5s ease both" }}>
            <div style={{
              width: 70, height: 70,
              border: "2px solid var(--celeste)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "8px auto 26px", color: "var(--celeste)",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, color: "var(--white)", fontSize: 30, marginBottom: 12 }}>
              ¡Listo, {firstName}!
            </h3>
            <p style={{ color: "var(--txt-2)", fontSize: 15, lineHeight: 1.6, fontWeight: 300, maxWidth: 320, margin: "0 auto" }}>
              Hemos recibido tu solicitud. Una de nuestras especialistas te contactará muy pronto.
            </p>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--dorado)", fontSize: 18, marginTop: 20 }}>
              Tu piel merece resultados reales.
            </p>
          </div>
        )}

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(18px) scale(0.98); }
            to   { opacity: 1; transform: none; }
          }
          .lf-field { margin-bottom: 16px; }
          .lf-field label {
            display: block; font-size: 11px; letter-spacing: 0.1em;
            text-transform: uppercase; color: var(--txt-3);
            margin-bottom: 8px; font-weight: 500; font-family: var(--font-sans);
          }
          .lf-field input, .lf-field select {
            width: 100%; background: #04080F;
            border: 1px solid var(--hairline); color: var(--white);
            font-family: var(--font-sans); font-size: 15px;
            padding: 14px 15px; border-radius: 0;
            transition: border-color .25s ease, box-shadow .25s ease;
            appearance: none;
          }
          .lf-field input::placeholder { color: rgba(255,255,255,0.28); }
          .lf-field input:focus, .lf-field select:focus {
            outline: none; border-color: var(--celeste);
            box-shadow: 0 0 0 3px rgba(126,200,227,0.14);
          }
          .lf-select { position: relative; }
          .lf-select::after {
            content: ""; position: absolute;
            right: 16px; bottom: 19px;
            width: 8px; height: 8px;
            border-right: 1.5px solid var(--txt-3);
            border-bottom: 1.5px solid var(--txt-3);
            transform: rotate(45deg); pointer-events: none;
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children, isSelect }: { label: string; children: React.ReactNode; isSelect?: boolean }) {
  return (
    <div className={`lf-field${isSelect ? " lf-select" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
