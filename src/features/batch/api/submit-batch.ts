import { mockAfricanBeneficiaries } from '@/mockdata/mock-african-beneficiaries';
import { Beneficiary } from '@/types/api';
import { bulkProcessorApi, threatApi } from '@/lib/api-client';
import { env } from '@/config/env';

export const TENANTS = ['greenbank', 'redbank', 'bluebank'] as const;

// ---- CSV ↔ beneficiary helpers ----

function normalizeMsisdn(phone: string): string {
  return phone.replace(/[+\-\s()]/g, '');
}

export function getActiveBeneficiaries(): Beneficiary[] {
  return mockAfricanBeneficiaries.filter((b) => b.status === 'ACTIVE') as Beneficiary[];
}

export function generateCsvFromBeneficiaries(beneficiaries: Beneficiary[]): File {
  const header =
    'id,request_id,payment_mode,payer_identifier_type,payer_identifier,payee_identifier_type,payee_identifier,amount,currency,note';
  const rows = beneficiaries.map(
    (b, i) =>
      `${i},${crypto.randomUUID()},MASTERCARD_CBS,MSISDN,27000000000,MSISDN,${normalizeMsisdn(b.phoneNumberPrimary)},${b.monthlyPensionAmount},ZAR,GovStack pension - ${b.firstName} ${b.lastName} (${b.payeeIdentity})`,
  );
  return new File([[header, ...rows].join('\n')], 'bulk-govstack-mastercard.csv', {
    type: 'text/csv',
  });
}

export async function matchBeneficiariesFromCsv(file: File): Promise<Beneficiary[]> {
  const text = await file.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  const payeeIdx = headers.indexOf('payee_identifier');
  if (payeeIdx === -1) return [];
  const msisdns = new Set(lines.slice(1).map((l) => l.split(',')[payeeIdx]).filter(Boolean));
  return mockAfricanBeneficiaries.filter((b) =>
    msisdns.has(normalizeMsisdn(b.phoneNumberPrimary)),
  ) as Beneficiary[];
}
export type Tenant = (typeof TENANTS)[number];

export type SubmitBatchParams = {
  csvFile: File;
  tenant: Tenant;
  govstack: boolean;
  registeringInstitution?: string;
  program?: string;
  privateKey?: string;
  correlationId?: string;
};

export type BatchSubmitResult = {
  correlationId: string;
  /** UUID segment from API `PollingPath` when present. */
  batchId?: string;
  [key: string]: unknown;
};

const BATCH_SUMMARY_UUID =
  /\/batch\/Summary\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i;

export function parseBatchIdFromPollingPath(pollingPath: unknown): string | undefined {
  if (typeof pollingPath !== 'string') {
    return undefined;
  }
  const m = pollingPath.match(BATCH_SUMMARY_UUID);
  return m?.[1];
}

async function appendCsvToForm(form: FormData, csvFile: File): Promise<void> {
  const csvText = await csvFile.text();
  const csvBlob = new Blob([csvText], { type: 'text/csv' });
  form.append('data', csvBlob, csvFile.name);
}

async function generateSignature(
  csvFile: File,
  tenant: string,
  correlationId: string,
  privateKey: string,
): Promise<string> {
  const form = new FormData();
  await appendCsvToForm(form, csvFile);

  const signature = await threatApi.post<unknown, string>('/api/v1/util/x-signature', form, {
    headers: {
      'X-CorrelationID': correlationId,
      'Platform-TenantId': tenant,
      privateKey,
    },
    transformResponse: (data) => data,
  });

  return signature;
}

export async function submitBatch({
  csvFile,
  tenant,
  govstack,
  registeringInstitution,
  program,
  privateKey = env.DEFAULT_PRIVATE_KEY_MIFOS,
  correlationId: providedCorrelationId,
}: SubmitBatchParams): Promise<BatchSubmitResult> {
  const correlationId = providedCorrelationId ?? crypto.randomUUID();

  const signature = await generateSignature(csvFile, tenant, correlationId, privateKey);

  const form = new FormData();
  await appendCsvToForm(form, csvFile);

  const headers: Record<string, string> = {
    'X-Signature': signature,
    'X-CorrelationID': correlationId,
    'Platform-TenantId': tenant,
    type: 'csv',
    filename: csvFile.name,
    'X-CallbackURL': `http://ph-ee-connector-mock-payment-schema:8080/batches/${correlationId}/callback`,
    Purpose: 'Batch payment',
  };

  if (govstack) {
    headers['X-Registering-Institution-ID'] = registeringInstitution || tenant;
    if (program) headers['X-Program-ID'] = program;
  }

  const result = await bulkProcessorApi.post<unknown, Record<string, unknown>>(
    '/batchtransactions',
    form,
    { headers },
  );

  const batchId = parseBatchIdFromPollingPath(result?.PollingPath);
  return { ...(result ?? {}), correlationId, batchId };
}
