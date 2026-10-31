"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Send, Smartphone } from "lucide-react";
import qrcode from "qrcode-generator";
import { useEffect, useMemo, useState } from "react";
import type { MedDocument } from "@/lib/types";
import { documentsService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** QR-код рисуется локально (без сети): каждая тёмная клетка — квадрат SVG */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const dark: [number, number][] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) dark.push([c, r]);
    return { n, dark };
  }, [value]);
  return (
    <svg viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} width={size} height={size} role="img" aria-label="QR-код для подтверждения подписи" className="rounded-xl bg-white">
      <path d={cells.dark.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join("")} fill="#1e3836" />
    </svg>
  );
}

type Step = "qr" | "signed";

/**
 * Подпись документа врачом: «Подтвердите подпись в телефоне».
 * В демо подтверждение приходит само через 2 секунды.
 */
export function SignModal({ doc, onClose, onSigned }: { doc: MedDocument | null; onClose: () => void; onSigned?: (text: string) => void }) {
  return (
    <Modal open={!!doc} onClose={onClose} title="Подпись документа">
      {doc && <SignFlow key={doc.id} doc={doc} onClose={onClose} onSigned={onSigned} />}
    </Modal>
  );
}

function SignFlow({ doc, onClose, onSigned }: { doc: MedDocument; onClose: () => void; onSigned?: (text: string) => void }) {
  const [step, setStep] = useState<Step>("qr");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      await documentsService.sign(doc.id);
      setStep("signed");
    }, 2000);
    return () => clearTimeout(t);
  }, [doc.id]);

  const send = async () => {
    setSending(true);
    await documentsService.send(doc.id);
    onSigned?.("Документ отправлен в ЕГИСЗ через N3.Health");
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {step === "qr" ? (
        <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
          <p className="text-[15px] text-muted">{doc.title}</p>
          <div className="mx-auto mt-5 w-fit rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow-soft)]">
            <QrCode value={`https://sign.revital.demo/doc/${doc.id}`} />
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-[17px] font-semibold text-forest-deep">
            <Smartphone size={20} className="text-teal" /> Подтвердите подпись в телефоне
          </div>
          <ol className="mx-auto mt-3 max-w-xs space-y-1 text-left text-[14px] text-ink/80">
            <li>1. Откройте приложение электронной подписи</li>
            <li>2. Наведите камеру на код</li>
            <li>3. Нажмите «Подписать»</li>
          </ol>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-[14px] text-muted">
            <Loader2 size={16} className="animate-spin" /> Ждём подтверждения…
          </div>
          <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-muted">В рабочей версии — облачная электронная подпись врача.</p>
        </motion.div>
      ) : (
        <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-ok">
            <CheckCircle2 size={34} />
          </motion.span>
          <div className="font-display mt-4 text-[28px] text-forest-deep">Документ подписан</div>
          <p className="mt-1 text-[15px] text-muted">Теперь его можно отправить в ЕГИСЗ — через сервис N3.Health.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Отправить в ЕГИСЗ
            </Button>
            <Button variant="ghost" onClick={() => { onSigned?.("Документ подписан"); onClose(); }}>Отправить позже</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
