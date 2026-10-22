"use client";

import { useEffect, useState } from "react";
import type { ApplicationMode } from "@/lib/jobs/job-posting";
import { publicSignupPath } from "@/lib/jobs/public-job-link";
import JobApplyButton from "./JobApplyButton";
import styles from "./vagas.module.css";

export default function JobCandidatar({
  jobId,
  mode,
  externalApplyUrl,
}: {
  jobId: string;
  mode: ApplicationMode;
  externalApplyUrl: string | null;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/vagas/${jobId}/candidatura`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!cancelled) setAuthenticated(response.ok && data.authenticated === true);
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (authenticated === null) {
    return (
      <div className={styles.apply}>
        <button type="button" disabled>Candidatar-se</button>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={styles.apply}>
        <a className={`${styles.externalLink} ri-btn-3d-gold`} href={publicSignupPath(jobId)}>
          Candidatar-se
        </a>
      </div>
    );
  }

  if (mode === "EXTERNAL" && externalApplyUrl) {
    return (
      <div className={styles.apply}>
        <a className={`${styles.externalLink} ri-btn-3d-gold`} href={externalApplyUrl}>
          Candidatar-se
        </a>
      </div>
    );
  }

  return (
    <JobApplyButton jobId={jobId} autoApply={false} />
  );
}
