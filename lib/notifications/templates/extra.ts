import type { SupportedLocale } from "@/lib/i18n/locales";
import type { NotificationEvent, SafeNotificationPayload } from "@/lib/notifications/types";

type Body = (payload: SafeNotificationPayload, url: string) => string;

export type ExtraTemplate = {
  key: string;
  event: NotificationEvent;
  locale: SupportedLocale;
  title: string;
  body: Body;
};

function company(payload: SafeNotificationPayload, fallback: string): string {
  return payload.companyName || fallback;
}

function person(payload: SafeNotificationPayload, fallback: string): string {
  return payload.professionalName || fallback;
}

function row(
  locale: SupportedLocale,
  event: NotificationEvent,
  title: string,
  body: Body,
): ExtraTemplate {
  return { key: `${event}_${locale}`, event, locale, title, body };
}

const events: NotificationEvent[] = [
  "interview_invite",
  "interview_confirmed",
  "interview_rescheduled",
  "interview_cancelled",
  "interview_reminder",
  "new_message",
  "invite_accepted",
  "invite_declined",
  "process_stage_changed",
];

type Copy = {
  locale: SupportedLocale;
  titles: readonly string[];
  bodies: readonly Body[];
};

const copies: Copy[] = [
  {
    locale: "es",
    titles: [
      "Invitación a entrevista",
      "Entrevista confirmada",
      "Entrevista reprogramada",
      "Entrevista cancelada",
      "Recordatorio de entrevista",
      "Nuevo mensaje",
      "Invitación aceptada",
      "Invitación rechazada",
      "Actualización del proceso",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "Una empresa")} le invitó a una entrevista${p.scheduledAtLabel ? ` el ${p.scheduledAtLabel}` : ""}. Acceda: ${url}`,
      (p, url) =>
        `Recruta Indústria: entrevista con ${company(p, "la empresa")} confirmada${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. Detalles: ${url}`,
      (p, url) =>
        `Recruta Indústria: nueva fecha y hora con ${company(p, "la empresa")}${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. Ver: ${url}`,
      (p, url) =>
        `Recruta Indústria: la entrevista con ${company(p, "la empresa")} fue cancelada. Seguimiento: ${url}`,
      (p, url) =>
        `Recruta Indústria: recordatorio — entrevista${p.scheduledAtLabel ? ` el ${p.scheduledAtLabel}` : ""}${p.companyName ? ` con ${p.companyName}` : ""}. Abrir: ${url}`,
      (p, url) =>
        `Recruta Indústria: nuevo mensaje${p.companyName ? ` de ${p.companyName}` : ""}. Léalo en el panel: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "El profesional")} aceptó la invitación. Panel: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "El profesional")} rechazó la invitación. Panel: ${url}`,
      (p, url) =>
        `Recruta Indústria: etapa actualizada${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. Ver: ${url}`,
    ],
  },
  {
    locale: "fr",
    titles: [
      "Invitation à un entretien",
      "Entretien confirmé",
      "Entretien reporté",
      "Entretien annulé",
      "Rappel d'entretien",
      "Nouveau message",
      "Invitation acceptée",
      "Invitation refusée",
      "Mise à jour du processus",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria : ${company(p, "Une entreprise")} vous invite à un entretien${p.scheduledAtLabel ? ` le ${p.scheduledAtLabel}` : ""}. Accéder : ${url}`,
      (p, url) =>
        `Recruta Indústria : entretien avec ${company(p, "l'entreprise")} confirmé${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. Détails : ${url}`,
      (p, url) =>
        `Recruta Indústria : nouvelle date et heure avec ${company(p, "l'entreprise")}${p.scheduledAtLabel ? ` : ${p.scheduledAtLabel}` : ""}. Voir : ${url}`,
      (p, url) =>
        `Recruta Indústria : l'entretien avec ${company(p, "l'entreprise")} a été annulé. Suivi : ${url}`,
      (p, url) =>
        `Recruta Indústria : rappel — entretien${p.scheduledAtLabel ? ` le ${p.scheduledAtLabel}` : ""}${p.companyName ? ` avec ${p.companyName}` : ""}. Ouvrir : ${url}`,
      (p, url) =>
        `Recruta Indústria : nouveau message${p.companyName ? ` de ${p.companyName}` : ""}. Lire dans le tableau de bord : ${url}`,
      (p, url) =>
        `Recruta Indústria : ${person(p, "Le professionnel")} a accepté l'invitation. Tableau de bord : ${url}`,
      (p, url) =>
        `Recruta Indústria : ${person(p, "Le professionnel")} a refusé l'invitation. Tableau de bord : ${url}`,
      (p, url) =>
        `Recruta Indústria : étape mise à jour${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. Voir : ${url}`,
    ],
  },
  {
    locale: "de",
    titles: [
      "Einladung zum Gespräch",
      "Gespräch bestätigt",
      "Gespräch verschoben",
      "Gespräch abgesagt",
      "Erinnerung an das Gespräch",
      "Neue Nachricht",
      "Einladung angenommen",
      "Einladung abgelehnt",
      "Aktualisierung des Verfahrens",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "Ein Unternehmen")} hat Sie zu einem Gespräch eingeladen${p.scheduledAtLabel ? ` am ${p.scheduledAtLabel}` : ""}. Öffnen: ${url}`,
      (p, url) =>
        `Recruta Indústria: Gespräch mit ${company(p, "dem Unternehmen")} bestätigt${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. Details: ${url}`,
      (p, url) =>
        `Recruta Indústria: neuer Termin mit ${company(p, "dem Unternehmen")}${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. Ansehen: ${url}`,
      (p, url) =>
        `Recruta Indústria: das Gespräch mit ${company(p, "dem Unternehmen")} wurde abgesagt. Weiter: ${url}`,
      (p, url) =>
        `Recruta Indústria: Erinnerung — Gespräch${p.scheduledAtLabel ? ` am ${p.scheduledAtLabel}` : ""}${p.companyName ? ` mit ${p.companyName}` : ""}. Öffnen: ${url}`,
      (p, url) =>
        `Recruta Indústria: neue Nachricht${p.companyName ? ` von ${p.companyName}` : ""}. Im Bereich lesen: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "Die Fachkraft")} hat die Einladung angenommen. Bereich: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "Die Fachkraft")} hat die Einladung abgelehnt. Bereich: ${url}`,
      (p, url) =>
        `Recruta Indústria: Schritt aktualisiert${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. Ansehen: ${url}`,
    ],
  },
  {
    locale: "it",
    titles: [
      "Invito al colloquio",
      "Colloquio confermato",
      "Colloquio riprogrammato",
      "Colloquio annullato",
      "Promemoria del colloquio",
      "Nuovo messaggio",
      "Invito accettato",
      "Invito rifiutato",
      "Aggiornamento del processo",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "Un'azienda")} la invita a un colloquio${p.scheduledAtLabel ? ` il ${p.scheduledAtLabel}` : ""}. Acceda: ${url}`,
      (p, url) =>
        `Recruta Indústria: colloquio con ${company(p, "l'azienda")} confermato${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. Dettagli: ${url}`,
      (p, url) =>
        `Recruta Indústria: nuova data e ora con ${company(p, "l'azienda")}${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. Veda: ${url}`,
      (p, url) =>
        `Recruta Indústria: il colloquio con ${company(p, "l'azienda")} è stato annullato. Segua: ${url}`,
      (p, url) =>
        `Recruta Indústria: promemoria — colloquio${p.scheduledAtLabel ? ` il ${p.scheduledAtLabel}` : ""}${p.companyName ? ` con ${p.companyName}` : ""}. Aprire: ${url}`,
      (p, url) =>
        `Recruta Indústria: nuovo messaggio${p.companyName ? ` da ${p.companyName}` : ""}. Lo legga nel pannello: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "Il professionista")} ha accettato l'invito. Pannello: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "Il professionista")} ha rifiutato l'invito. Pannello: ${url}`,
      (p, url) =>
        `Recruta Indústria: fase aggiornata${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. Veda: ${url}`,
    ],
  },
  {
    locale: "pt-PT",
    titles: [
      "Convite para entrevista",
      "Entrevista confirmada",
      "Entrevista reagendada",
      "Entrevista cancelada",
      "Lembrete de entrevista",
      "Nova mensagem",
      "Convite aceite",
      "Convite recusado",
      "Atualização do processo",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "Uma empresa")} convidou-o para uma entrevista${p.scheduledAtLabel ? ` em ${p.scheduledAtLabel}` : ""}. Aceda: ${url}`,
      (p, url) =>
        `Recruta Indústria: entrevista com ${company(p, "a empresa")} confirmada${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. Detalhes: ${url}`,
      (p, url) =>
        `Recruta Indústria: nova data e hora com ${company(p, "a empresa")}${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. Veja: ${url}`,
      (p, url) =>
        `Recruta Indústria: a entrevista com ${company(p, "a empresa")} foi cancelada. Acompanhe: ${url}`,
      (p, url) =>
        `Recruta Indústria: lembrete — entrevista${p.scheduledAtLabel ? ` em ${p.scheduledAtLabel}` : ""}${p.companyName ? ` com ${p.companyName}` : ""}. Abrir: ${url}`,
      (p, url) =>
        `Recruta Indústria: nova mensagem${p.companyName ? ` de ${p.companyName}` : ""}. Leia no painel: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "O profissional")} aceitou o convite. Painel: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${person(p, "O profissional")} recusou o convite. Painel: ${url}`,
      (p, url) =>
        `Recruta Indústria: etapa atualizada${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. Ver: ${url}`,
    ],
  },
  {
    locale: "zh-CN",
    titles: [
      "面试邀请",
      "面试已确认",
      "面试已改期",
      "面试已取消",
      "面试提醒",
      "新消息",
      "邀请已接受",
      "邀请已拒绝",
      "流程更新",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria：${company(p, "一家企业")}邀请您参加面试${p.scheduledAtLabel ? `（${p.scheduledAtLabel}）` : ""}。打开：${url}`,
      (p, url) =>
        `Recruta Indústria：与${company(p, "该企业")}的面试已确认${p.scheduledAtLabel ? `（${p.scheduledAtLabel}）` : ""}。详情：${url}`,
      (p, url) =>
        `Recruta Indústria：与${company(p, "该企业")}的新时间${p.scheduledAtLabel ? `：${p.scheduledAtLabel}` : ""}。查看：${url}`,
      (p, url) => `Recruta Indústria：与${company(p, "该企业")}的面试已取消。跟进：${url}`,
      (p, url) =>
        `Recruta Indústria：提醒 — 面试${p.scheduledAtLabel ? `（${p.scheduledAtLabel}）` : ""}${p.companyName ? `，企业：${p.companyName}` : ""}。打开：${url}`,
      (p, url) =>
        `Recruta Indústria：新消息${p.companyName ? `，来自${p.companyName}` : ""}。在面板中阅读：${url}`,
      (p, url) => `Recruta Indústria：${person(p, "该专业人员")}已接受邀请。面板：${url}`,
      (p, url) => `Recruta Indústria：${person(p, "该专业人员")}已拒绝邀请。面板：${url}`,
      (p, url) =>
        `Recruta Indústria：阶段已更新${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? `（${p.companyName}）` : ""}。查看：${url}`,
    ],
  },
  {
    locale: "ja",
    titles: [
      "面接への招待",
      "面接が確定しました",
      "面接の日時が変更されました",
      "面接が取り消されました",
      "面接のリマインダー",
      "新しいメッセージ",
      "招待を承諾しました",
      "招待を辞退しました",
      "選考状況の更新",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "企業")}から面接の招待があります${p.scheduledAtLabel ? `（${p.scheduledAtLabel}）` : ""}。開く: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${company(p, "企業")}との面接が確定しました${p.scheduledAtLabel ? `（${p.scheduledAtLabel}）` : ""}。詳細: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${company(p, "企業")}との新しい日時${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}。見る: ${url}`,
      (p, url) => `Recruta Indústria: ${company(p, "企業")}との面接は取り消されました。確認: ${url}`,
      (p, url) =>
        `Recruta Indústria: リマインダー — 面接${p.scheduledAtLabel ? `（${p.scheduledAtLabel}）` : ""}${p.companyName ? `（${p.companyName}）` : ""}。開く: ${url}`,
      (p, url) =>
        `Recruta Indústria: 新しいメッセージ${p.companyName ? `（${p.companyName}）` : ""}。パネルで読む: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "専門家")}が招待を承諾しました。パネル: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "専門家")}が招待を辞退しました。パネル: ${url}`,
      (p, url) =>
        `Recruta Indústria: 段階を更新しました${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? `（${p.companyName}）` : ""}。見る: ${url}`,
    ],
  },
  {
    locale: "ko",
    titles: [
      "면접 초대",
      "면접이 확정되었습니다",
      "면접 일정이 변경되었습니다",
      "면접이 취소되었습니다",
      "면접 알림",
      "새 메시지",
      "초대를 수락했습니다",
      "초대를 거절했습니다",
      "진행 단계 업데이트",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "기업")}에서 면접에 초대했습니다${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. 열기: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${company(p, "기업")}와의 면접이 확정되었습니다${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. 자세히: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${company(p, "기업")}와의 새 일정${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. 보기: ${url}`,
      (p, url) => `Recruta Indústria: ${company(p, "기업")}와의 면접이 취소되었습니다. 확인: ${url}`,
      (p, url) =>
        `Recruta Indústria: 알림 — 면접${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}${p.companyName ? ` (${p.companyName})` : ""}. 열기: ${url}`,
      (p, url) =>
        `Recruta Indústria: 새 메시지${p.companyName ? ` (${p.companyName})` : ""}. 패널에서 읽기: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "전문가")}가 초대를 수락했습니다. 패널: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "전문가")}가 초대를 거절했습니다. 패널: ${url}`,
      (p, url) =>
        `Recruta Indústria: 단계가 업데이트되었습니다${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. 보기: ${url}`,
    ],
  },
  {
    locale: "ar",
    titles: [
      "دعوة إلى مقابلة",
      "تم تأكيد المقابلة",
      "تم تغيير موعد المقابلة",
      "تم إلغاء المقابلة",
      "تذكير بالمقابلة",
      "رسالة جديدة",
      "تم قبول الدعوة",
      "تم رفض الدعوة",
      "تحديث المرحلة",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: دعوة إلى مقابلة من ${company(p, "شركة")}${p.scheduledAtLabel ? ` في ${p.scheduledAtLabel}` : ""}. افتح: ${url}`,
      (p, url) =>
        `Recruta Indústria: تم تأكيد المقابلة مع ${company(p, "الشركة")}${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. التفاصيل: ${url}`,
      (p, url) =>
        `Recruta Indústria: موعد جديد مع ${company(p, "الشركة")}${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. عرض: ${url}`,
      (p, url) => `Recruta Indústria: تم إلغاء المقابلة مع ${company(p, "الشركة")}. المتابعة: ${url}`,
      (p, url) =>
        `Recruta Indústria: تذكير — مقابلة${p.scheduledAtLabel ? ` في ${p.scheduledAtLabel}` : ""}${p.companyName ? ` مع ${p.companyName}` : ""}. فتح: ${url}`,
      (p, url) =>
        `Recruta Indústria: رسالة جديدة${p.companyName ? ` من ${p.companyName}` : ""}. اقرأها في اللوحة: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "المهني")} قبل الدعوة. اللوحة: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "المهني")} رفض الدعوة. اللوحة: ${url}`,
      (p, url) =>
        `Recruta Indústria: تم تحديث المرحلة${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. عرض: ${url}`,
    ],
  },
  {
    locale: "hi",
    titles: [
      "साक्षात्कार का निमंत्रण",
      "साक्षात्कार की पुष्टि",
      "साक्षात्कार का समय बदला",
      "साक्षात्कार रद्द",
      "साक्षात्कार की याद",
      "नया संदेश",
      "निमंत्रण स्वीकार",
      "निमंत्रण अस्वीकार",
      "प्रक्रिया का अपडेट",
    ],
    bodies: [
      (p, url) =>
        `Recruta Indústria: ${company(p, "एक कंपनी")} ने आपको साक्षात्कार के लिए आमंत्रित किया${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. खोलें: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${company(p, "कंपनी")} के साथ साक्षात्कार की पुष्टि हो गई${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}. विवरण: ${url}`,
      (p, url) =>
        `Recruta Indústria: ${company(p, "कंपनी")} के साथ नई तिथि और समय${p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""}. देखें: ${url}`,
      (p, url) => `Recruta Indústria: ${company(p, "कंपनी")} के साथ साक्षात्कार रद्द कर दिया गया. आगे: ${url}`,
      (p, url) =>
        `Recruta Indústria: याद — साक्षात्कार${p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""}${p.companyName ? ` ${p.companyName} के साथ` : ""}. खोलें: ${url}`,
      (p, url) =>
        `Recruta Indústria: नया संदेश${p.companyName ? ` ${p.companyName} से` : ""}. पैनल में पढ़ें: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "पेशेवर")} ने निमंत्रण स्वीकार किया. पैनल: ${url}`,
      (p, url) => `Recruta Indústria: ${person(p, "पेशेवर")} ने निमंत्रण अस्वीकार किया. पैनल: ${url}`,
      (p, url) =>
        `Recruta Indústria: चरण अपडेट हुआ${p.stageLabel ? ` — ${p.stageLabel}` : ""}${p.companyName ? ` (${p.companyName})` : ""}. देखें: ${url}`,
    ],
  },
];

export const extraTemplates: ExtraTemplate[] = copies.flatMap((copy) =>
  events.map((event, index) => row(copy.locale, event, copy.titles[index], copy.bodies[index])),
);
