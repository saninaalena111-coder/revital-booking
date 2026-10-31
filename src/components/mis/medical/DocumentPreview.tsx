"use client";

import { Printer } from "lucide-react";
import type { MedDocument, Patient } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { patientAge, patientFullName, visitsService } from "@/services";
import { fmtDay } from "@/lib/time";
import { Modal } from "@/components/ui/Modal";
import { ComingSoonButton } from "../ComingSoon";
import { DocStatusPill } from "../ui";

/** Документ на «фирменном бланке» — так его увидит гость и отправит ЕГИСЗ */
export function DocumentSheet({ doc, patient }: { doc: MedDocument; patient: Patient }) {
  const { tenant } = useSession();
  const san = tenant.sanatoriums.find((s) => s.id === (patient.sanatoriumId ?? tenant.primary))!;
  return (
    <article className="rounded-2xl border border-line bg-white p-5 text-[14.5px] leading-relaxed text-ink shadow-[var(--shadow-soft)] sm:p-8">
      <header className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-teal">{san.title}</div>
          <div className="text-[12px] text-muted">{san.address}</div>
        </div>
        <DocStatusPill status={doc.status} />
      </header>
      <h2 className="font-display mt-5 text-[28px] leading-tight text-forest-deep">{doc.title}</h2>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[13.5px] sm:grid-cols-2">
        <div><dt className="inline text-muted">Пациент: </dt><dd className="inline font-medium">{patientFullName(patient)}</dd></div>
        <div><dt className="inline text-muted">Возраст: </dt><dd className="inline">{patientAge(patient)} лет</dd></div>
        <div><dt className="inline text-muted">Дата: </dt><dd className="inline">{fmtDay(doc.date)} 2026 г.</dd></div>
        <div><dt className="inline text-muted">Врач: </dt><dd className="inline">{visitsService.doctorName(doc.doctorId)}</dd></div>
      </dl>
      <div className="mt-5 space-y-4">
        {doc.body.map((b) => (
          <section key={b.heading}>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">{b.heading}</h3>
            <p className="mt-1 whitespace-pre-line">{b.text}</p>
          </section>
        ))}
      </div>
      <footer className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4 text-[13px] text-muted">
        <span>
          {doc.status === "draft" ? "Документ не подписан" : `Подписано электронной подписью: ${visitsService.doctorName(doc.doctorId)}`}
        </span>
        {doc.remdId && <span>Регистрационный номер: {doc.remdId}</span>}
      </footer>
    </article>
  );
}

export function DocumentModal({ doc, patient, onClose, actions }: { doc: MedDocument | null; patient?: Patient; onClose: () => void; actions?: React.ReactNode }) {
  return (
    <Modal open={!!doc && !!patient} onClose={onClose} wide title="Предпросмотр документа">
      {doc && patient && (
        <>
          <DocumentSheet doc={doc} patient={patient} />
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ComingSoonButton feature="print" variant="ghost">
              <Printer size={16} /> Печать
            </ComingSoonButton>
            {actions}
          </div>
        </>
      )}
    </Modal>
  );
}
