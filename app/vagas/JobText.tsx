import { linkifyJobText } from "@/lib/jobs/job-text-links";
import styles from "./vagas.module.css";

export default function JobText({ text }: { text: string }) {
  const parts = linkifyJobText(text);
  if (parts.length === 0) return null;

  return (
    <p className={styles.text}>
      {parts.map((part, index) =>
        part.type === "text" ? (
          <span key={index}>{part.value}</span>
        ) : (
          <a
            key={index}
            className={styles.inlineLink}
            href={part.href}
            {...(part.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {part.value}
          </a>
        ),
      )}
    </p>
  );
}
