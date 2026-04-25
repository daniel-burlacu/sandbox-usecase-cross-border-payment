import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useInitiatedTransactions } from '@/hooks/initiated-transactions';
import { getFeeAmount } from '@/utils/transactionConversions';
import { getFXRateZWGFtoZAR } from '@/utils/transactionConversions';

interface TransactionInitiatedViewProps {
    payeeIdentity: string;
}

export const TransactionInitiatedView = ({
    payeeIdentity,
}: TransactionInitiatedViewProps) => {
    const navigate = useNavigate();
    const { transactionsInitiated } = useInitiatedTransactions();
    const tx = transactionsInitiated.find(
        (t) => t.payeeIdentity === payeeIdentity
    );

    if (!tx) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minHeight="80vh"
            >
                <Paper
                    sx={{
                        p: 4,
                        minWidth: 360,
                        borderRadius: 3,
                        boxShadow: '0 4px 28px 0 #d4f5f6ff',
                        position: 'relative',
                        textAlign: 'center',
                    }}
                >
                    <IconButton
                        aria-label="Close"
                        onClick={() => navigate(-1)}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#060606ff',
                        }}
                    >
                        <CloseIcon fontSize="medium" />
                    </IconButton>
                    <Typography variant="h6" mb={2} color="error">
                        Transaction Not Found
                    </Typography>
                    <Typography color="text.secondary" mb={2}>
                        The transaction with the provided Payee Identity does not exist or has been removed.
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <Paper
                sx={{
                    p: { xs: 2, sm: 4 },
                    minWidth: { xs: 320, sm: 450 },
                    maxWidth: 480,
                    borderRadius: 4,
                    boxShadow: '0 4px 28px 0 #d4f5f6ff',
                    position: 'relative',
                }}
            >
                <IconButton
                    aria-label="Close"
                    onClick={() => navigate(-1)}
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        color: '#0fb0efff',
                        zIndex: 2,
                    }}
                >
                    <CloseIcon fontSize="medium" />
                </IconButton>
                <Typography
                    variant="h5"
                    fontWeight={800}
                    color="#4d5051ff"
                    mb={1.5}
                    textAlign="center"
                >
                    Payment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={600} color="#4caf50">
                        {tx.status === 'COMPLETED'
                            ? '✅ Completed'
                            : tx.status === 'FAILED'
                                ? '❌ Failed'
                                : '⏳ In Progress'}
                    </Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={1}>
                    <InfoRow label="Batch ID" value={tx.batchId ?? '—'} />
                    <InfoRow label="Payee Identity" value={tx.payeeIdentity} />
                    <InfoRow label="Beneficiary Name" value={tx.payee} />
                    <InfoRow label="Duration" value={`${tx.duration} seconds`} />
                    <InfoRow label="From Bank" value={tx.fromBank} />
                    <InfoRow label="To Bank" value={tx.toBank} />
                    <InfoRow
                        label="Transaction Fee"
                        value={getFeeAmount().toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'ZWG',
                            minimumFractionDigits: 2,
                        })}

                    />
                    <InfoRow
                        label="Amount Sent"
                        value={tx.amountSent.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'ZWG',
                        })}
                    />
                    <InfoRow
                        label="FX Rate"
                        value={getFXRateZWGFtoZAR().toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'ZAR',
                            minimumFractionDigits: 4,
                        })}
                    />

                    <InfoRow
                        label="Amount Received"
                        value={Number(tx.amountReceived.toPrecision(6)).toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'ZAR',
                        })}

                    />

                </Box>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate(-1)}
                    fullWidth
                    sx={{ mt: 4, fontWeight: 600 }}
                >
                    Back to Transactions
                </Button>
            </Paper>
        </Box>
    );
};

// --- Helper for formatting label/value pairs ---
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {label}:
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary">
            {value}
        </Typography>
    </Box>
);
