import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Icon,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useRef, useState } from 'react';

import {
  TENANTS,
  Tenant,
  BatchSubmitResult,
  generateCsvFromBeneficiaries,
  getActiveBeneficiaries,
  matchBeneficiariesFromCsv,
  submitBatch,
} from '@/features/batch/api/submit-batch';
import { useInitiatedTransactions } from '@/hooks/initiated-transactions';
import { Beneficiary, InitiatedTransaction } from '@/types/api';
import { env } from '@/config/env';

type Status = 'idle' | 'signing' | 'submitting' | 'success' | 'error';

function toInitiatedTransaction(
  b: Beneficiary,
  correlationId: string,
  batchId?: string,
): InitiatedTransaction {
  return {
    payeeIdentity: b.payeeIdentity,
    correlationId,
    batchId,
    payee: `${b.firstName} ${b.lastName}`,
    duration: 2.5,
    executionDate: new Date().toISOString(),
    fromBank: 'Zimbabwe Pension Fund',
    toBank: b.bankName,
    fxRateToUSD: 0.055,
    fxRateToZar: 1,
    transactionFee: 0,
    amountSent: b.monthlyPensionAmount,
    amountReceived: b.monthlyPensionAmount,
    status: 'COMPLETED',
  };
}

export const BatchSubmitForm = () => {
  const { addTransaction, transactionsInitiated } = useInitiatedTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [tenant, setTenant] = useState<Tenant>('greenbank');
  const [govstack, setGovstack] = useState(false);
  const [registeringInstitution, setRegisteringInstitution] = useState('');
  const [program, setProgram] = useState('');
  const [privateKey, setPrivateKey] = useState(env.DEFAULT_PRIVATE_KEY_MIFOS);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<BatchSubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedCount, setSubmittedCount] = useState(0);

  const activeBeneficiaries = getActiveBeneficiaries();
  const alreadyPaidIds = new Set(transactionsInitiated.map((t) => t.payeeIdentity));
  const outstanding = activeBeneficiaries.filter((b) => !alreadyPaidIds.has(b.payeeIdentity));

  const runSubmit = async (file: File) => {
    setResult(null);
    setErrorMessage('');
    setStatus('signing');
    try {
      const res = await submitBatch({
        csvFile: file,
        tenant,
        govstack,
        registeringInstitution: registeringInstitution || undefined,
        program: program || undefined,
        privateKey,
      });
      const matched = await matchBeneficiariesFromCsv(file);
      matched.forEach((b) =>
        addTransaction(toInitiatedTransaction(b, res.correlationId, res.batchId)),
      );
      setSubmittedCount(matched.length);
      setStatus('success');
      setResult(res);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Batch submission failed');
    }
  };

  const handleQuickSubmit = () => runSubmit(generateCsvFromBeneficiaries(outstanding));

  const handleCsvSubmit = () => { if (csvFile) runSubmit(csvFile); };

  const reset = () => {
    setCsvFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
    setSubmittedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const busy = status === 'signing' || status === 'submitting';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 680 }}>

      {/* Quick submit */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Submit Outstanding Pensions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Auto-generates a CSV from the {outstanding.length} outstanding ACTIVE beneficiar{outstanding.length === 1 ? 'y' : 'ies'} and submits to PaymentHub.
        </Typography>
        {outstanding.length === 0 ? (
          <Alert severity="success" icon={<Icon baseClassName="material-symbols-outlined">check_circle</Icon>}>
            All active beneficiaries have been paid.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {outstanding.map((b) => (
              <Chip
                key={b.payeeIdentity}
                label={`${b.firstName} ${b.lastName} — ZAR ${b.monthlyPensionAmount.toLocaleString()}`}
                size="small"
                icon={<Icon baseClassName="material-symbols-outlined" sx={{ fontSize: '16px !important' }}>person</Icon>}
              />
            ))}
          </Box>
        )}
        <Button
          variant="contained"
          onClick={handleQuickSubmit}
          disabled={outstanding.length === 0 || busy}
          sx={{ backgroundColor: '#426834', '&:hover': { backgroundColor: '#55c9f7ff' } }}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Icon baseClassName="material-symbols-outlined">send</Icon>}
        >
          {busy ? (status === 'signing' ? 'Signing…' : 'Submitting…') : `Submit ${outstanding.length} Payment${outstanding.length !== 1 ? 's' : ''}`}
        </Button>
      </Paper>

      {/* Result */}
      {status === 'success' && result && (
        <Alert severity="success" onClose={reset} icon={<Icon baseClassName="material-symbols-outlined">check_circle</Icon>}>
          <Typography variant="body2" fontWeight={700}>
            {submittedCount} payment{submittedCount !== 1 ? 's' : ''} submitted — Payment-Log updated.
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
            Correlation ID: {result.correlationId}
          </Typography>
        </Alert>
      )}
      {status === 'error' && (
        <Alert severity="error" onClose={reset}>{errorMessage}</Alert>
      )}

      <Divider>OR</Divider>

      {/* Manual CSV upload */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Upload Custom CSV</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
            <Button
              variant="outlined"
              startIcon={<Icon baseClassName="material-symbols-outlined">upload_file</Icon>}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {csvFile ? 'Change CSV' : 'Select CSV File'}
            </Button>
            {csvFile && (
              <Chip label={csvFile.name} onDelete={() => setCsvFile(null)} sx={{ ml: 1.5 }}
                icon={<Icon baseClassName="material-symbols-outlined" sx={{ fontSize: '18px !important' }}>description</Icon>} />
            )}
          </Box>

          <FormControl size="small" sx={{ maxWidth: 200 }}>
            <InputLabel>Tenant</InputLabel>
            <Select value={tenant} label="Tenant" onChange={(e) => setTenant(e.target.value as Tenant)} disabled={busy}>
              {TENANTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={govstack} onChange={(e) => setGovstack(e.target.checked)} disabled={busy} />}
            label="GovStack mode"
          />

          {govstack && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: 1 }}>
              <TextField label="Registering Institution ID" size="small" value={registeringInstitution}
                onChange={(e) => setRegisteringInstitution(e.target.value)}
                placeholder={`defaults to tenant (${tenant})`} disabled={busy} sx={{ maxWidth: 360 }} />
              <TextField label="Program ID (optional)" size="small" value={program}
                onChange={(e) => setProgram(e.target.value)} disabled={busy} sx={{ maxWidth: 360 }} />
            </Box>
          )}

          <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <AccordionSummary expandIcon={<Icon baseClassName="material-symbols-outlined">expand_more</Icon>}>
              <Typography variant="body2">Advanced</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField label="Private Key" multiline rows={4} fullWidth size="small" value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)} disabled={busy}
                slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 11 } } }} />
            </AccordionDetails>
          </Accordion>

          <Button
            variant="contained"
            onClick={handleCsvSubmit}
            disabled={!csvFile || busy}
            sx={{ alignSelf: 'flex-start', backgroundColor: '#426834', '&:hover': { backgroundColor: '#55c9f7ff' } }}
          >
            Submit CSV
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
