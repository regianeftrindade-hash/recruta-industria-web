import { prisma } from '@/lib/db';

export type CompanyProfileTrackingData = {
  contatado: boolean;
  entrevistado: boolean;
  contratado: boolean;
  notes: string;
};

export const EMPTY_TRACKING: CompanyProfileTrackingData = {
  contatado: false,
  entrevistado: false,
  contratado: false,
  notes: '',
};

type TrackingRow = {
  contatado: boolean;
  entrevistado: boolean;
  contratado: boolean;
  notes: string | null;
};

type TrackingDelegate = {
  findUnique: (args: {
    where: { companyUserId_profileId: { companyUserId: string; profileId: string } };
  }) => Promise<TrackingRow | null>;
  upsert: (args: {
    where: { companyUserId_profileId: { companyUserId: string; profileId: string } };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }) => Promise<TrackingRow>;
};

function getTrackingDelegate(): TrackingDelegate | null {
  const delegate = (prisma as unknown as { companyProfileTracking?: TrackingDelegate })
    .companyProfileTracking;
  if (!delegate?.findUnique || !delegate?.upsert) return null;
  return delegate;
}

function mapRow(row: TrackingRow): CompanyProfileTrackingData {
  return {
    contatado: row.contatado,
    entrevistado: row.entrevistado,
    contratado: row.contratado,
    notes: row.notes || '',
  };
}

export async function getCompanyProfileTracking(
  companyUserId: string,
  profileId: string
): Promise<CompanyProfileTrackingData> {
  const db = getTrackingDelegate();
  if (!db) return { ...EMPTY_TRACKING };

  try {
    const row = await db.findUnique({
      where: {
        companyUserId_profileId: { companyUserId, profileId },
      },
    });
    if (!row) return { ...EMPTY_TRACKING };
    return mapRow(row);
  } catch (error) {
    console.warn('CompanyProfileTracking indisponível:', error);
    return { ...EMPTY_TRACKING };
  }
}

export async function upsertCompanyProfileTracking(
  companyUserId: string,
  profileId: string,
  data: Partial<CompanyProfileTrackingData>
): Promise<CompanyProfileTrackingData> {
  const db = getTrackingDelegate();
  if (!db) {
    console.warn('CompanyProfileTracking indisponível — reinicie o servidor após prisma generate');
    return {
      ...EMPTY_TRACKING,
      ...data,
      notes: data.notes ?? '',
    };
  }

  try {
    const row = await db.upsert({
      where: {
        companyUserId_profileId: { companyUserId, profileId },
      },
      create: {
        companyUserId,
        profileId,
        contatado: data.contatado ?? false,
        entrevistado: data.entrevistado ?? false,
        contratado: data.contratado ?? false,
        notes: data.notes?.trim() || null,
      },
      update: {
        ...(data.contatado !== undefined ? { contatado: data.contatado } : {}),
        ...(data.entrevistado !== undefined ? { entrevistado: data.entrevistado } : {}),
        ...(data.contratado !== undefined ? { contratado: data.contratado } : {}),
        ...(data.notes !== undefined ? { notes: data.notes.trim() || null } : {}),
      },
    });
    return mapRow(row);
  } catch (error) {
    console.warn('Falha ao salvar CompanyProfileTracking:', error);
    return {
      ...EMPTY_TRACKING,
      ...data,
      notes: data.notes ?? '',
    };
  }
}
