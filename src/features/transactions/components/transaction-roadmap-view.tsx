import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Paper,
    Stepper,
    Step,
    StepLabel,
    styled
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useTransactionBroadcast } from '@/hooks/transaction-broadcast-state';
import TransactionFinalStatus from "./transaction-final-status";
import { InitiatedTransaction } from "@/types/api";
import { useInitiatedTransactions } from "@/hooks/initiated-transactions";
import { getFeeAmount, getFXRateZWGtoUSD, getFXRateUSDtoZAR } from "@/utils/transactionConversions";
import { submitBatch } from "@/features/batch/api/submit-batch";

// Helper: Check if a number is prime
const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
};

const steps = [
    "Originating Bank",
    "Mastercard Network",
    "Destination Bank",
    "Funds Received",
    ""
];

import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";

const SINGLE_PAYMENT_CORRELATION_ID = '61ed1793-8150-439e-8ade-d09c633fe823';

function normalizeMsisdn(value: string | undefined): string {
    if (!value) return '';
    return value.replace(/[+\-\s()]/g, '');
}

function parseAmount(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function buildSinglePaymentCsv(transaction: InitiatedTransaction): File {
    const header =
        'id,request_id,payment_mode,payer_identifier_type,payer_identifier,payee_identifier_type,payee_identifier,amount,currency,note';
    const sanitizedPayeeIdentifier =
        normalizeMsisdn(transaction.payeeMsisdn) || transaction.payeeIdentity.replace(/\D/g, '') || '27000000001';
    const row =
        `0,${crypto.randomUUID()},MASTERCARD_CBS,MSISDN,27000000000,MSISDN,${sanitizedPayeeIdentifier},${transaction.amountSent},ZAR,GovStack pension - ${transaction.payee} (${transaction.payeeIdentity})`;

    return new File([[header, row].join('\n')], 'bulk-govstack-mastercard.csv', {
        type: 'text/csv',
    });
}

function createInitiatedTransactionDraft(transaction: Partial<InitiatedTransaction>): InitiatedTransaction {
    const legacyAmount = (transaction as { amount?: unknown; monthlyPensionAmount?: unknown }).amount;
    const monthlyPensionAmount = (transaction as { monthlyPensionAmount?: unknown }).monthlyPensionAmount;
    const normalizedAmountSent = parseAmount(transaction.amountSent ?? legacyAmount ?? monthlyPensionAmount);
    const normalizedAmountReceived = parseAmount(transaction.amountReceived ?? normalizedAmountSent);
    const correlationId =
        typeof transaction.correlationId === 'string' && transaction.correlationId.trim().length > 0
            ? transaction.correlationId.trim()
            : SINGLE_PAYMENT_CORRELATION_ID;

    return {
        payeeIdentity: transaction.payeeIdentity ?? "no identity",
        correlationId,
        payeeMsisdn: normalizeMsisdn(transaction.payeeMsisdn),
        payee: transaction.payee ?? "",
        duration: 20,
        executionDate: new Date().toISOString(),
        fromBank: transaction.fromBank ?? "Standard Bank of Zimbabwe (ZWG)",
        toBank: transaction.toBank ?? "Standard Bank of South Africa (ZAF)",
        transactionFee: getFeeAmount(),
        fxRateToUSD: getFXRateZWGtoUSD(),
        fxRateToZar: getFXRateUSDtoZAR(),
        amountSent: normalizedAmountSent,
        amountReceived: normalizedAmountReceived,
        status: "IN_PROGRESS",
    };
}

const CustomConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22, // aligns line with step circle
    },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        borderColor: "#0fb0efff", // ✅ blue when step is active
    },
    [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        borderColor: "#4caf50", // ✅ green when step is completed
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: "#ccc",  // default gray
        borderTopWidth: 2,
        borderRadius: 1,
        transition: "border-color 0.3s ease", // smooth transition
    },
}));

const StatusBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'active' && prop !== 'completed',
})<{ active?: boolean; completed?: boolean }>(
    ({ active, completed }) => ({
        padding: 16,
        marginTop: 8,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        backgroundColor: "#fafafa",
        boxShadow: completed
            ? "0 0 12px rgba(76, 175, 80, 0.6)" // ✅ Green glow when completed
            : active
                ? "0 0 12px rgba(15, 176, 239, 0.6)" // 🔵 Blue glow when active
                : "0 1px 3px rgba(0, 0, 0, 0.1)", // ⚪ Default light shadow
        transition: "box-shadow 0.4s ease, border-color 0.4s ease",
        minWidth: 180,
        minHeight: 162,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderColor: completed ? "#4caf50" : active ? "#0fb0efff" : "#e0e0e0",
    })
);

interface TransactionRoadMapProps {
    propTransaction?: InitiatedTransaction;
    compact?: boolean;
}

export const TransactionRoadmap = ({ propTransaction, compact = false }: TransactionRoadMapProps) => {

    const location = useLocation();
    const navigate = useNavigate();
    const transaction = (propTransaction || location.state || {}) as Partial<InitiatedTransaction>;
    const setBroadcastCompleted = useTransactionBroadcast((state) => state.setBroadcastCompleted);
    const { addTransaction } = useInitiatedTransactions();

    const [stepIndex, setStepIndex] = useState(0);
    const [randomNumber, setRandomNumber] = useState<number | null>(null);
    const [status, setStatus] = useState<boolean | undefined>(undefined);
    const txAddedRef = useRef(false); // Prevent adding duplicate transactions
    const completionHandledRef = useRef(false);
    const paymentSubmittedRef = useRef(false);
    const batchIdFromPaymentRef = useRef<string | undefined>(undefined);
    const [initiated, setInitiated] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [showFinal, setShowFinal] = useState(false);
    const [initiatedTx, setInitiatedTx] = useState<InitiatedTransaction>(
        createInitiatedTransactionDraft(transaction),
    );
    const num = 2;

    useEffect(() => {
        if (!initiated || completionHandledRef.current) {
            return;
        }

        if (stepIndex === steps.length - 1) {
            completionHandledRef.current = true;
            setRandomNumber(num);
            setStatus(isPrime(num));

            // Update global store for broadcast
            setBroadcastCompleted(isPrime(num), {
                id: 21,
                broadcast: "baf6c711-4858-484e-a7a5-23661a219cce",
                content: "Payment completed successfully. You have received your funds.".concat(" ", initiatedTx.amountReceived.toLocaleString(undefined, {
                    style: "currency",
                    currency: "ZAR",
                })),
                processed: isPrime(num),
                receiver: "mobile",
                sender: null,
                timestamp: new Date().toISOString(),
            });

            // --- ADD TRANSACTION ONLY IF PRIME ---
            if (isPrime(num) && !txAddedRef.current) {
                const completedTx: InitiatedTransaction = {
                    ...initiatedTx,
                    batchId: batchIdFromPaymentRef.current ?? initiatedTx.batchId,
                    status: "COMPLETED",
                    executionDate: new Date().toISOString(),
                };
                setInitiatedTx(completedTx);
                addTransaction(completedTx);
                txAddedRef.current = true;
            }
        }
    }, [addTransaction, initiated, initiatedTx, num, setBroadcastCompleted, stepIndex]);

    useEffect(() => {
        if (!initiated) {
            return;
        }

        const interval = setInterval(() => {
            setStepIndex((prev) => {
                if (prev >= steps.length - 1) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [initiated]);

    useEffect(() => {
        if (!initiated || stepIndex < 2 || paymentSubmittedRef.current) {
            return;
        }

        paymentSubmittedRef.current = true;
        let active = true;

        const submitSinglePayment = async () => {
            setIsSubmittingPayment(true);
            try {
                const csvFile = buildSinglePaymentCsv(initiatedTx);
                const res = await submitBatch({
                    csvFile,
                    tenant: 'greenbank',
                    govstack: false,
                    correlationId: initiatedTx.correlationId,
                });
                if (res.batchId) {
                    batchIdFromPaymentRef.current = res.batchId;
                    setInitiatedTx((prev) => ({ ...prev, batchId: res.batchId ?? prev.batchId }));
                }
            } catch {
                // Keep roadmap simulation progressing even when backend is unavailable.
            } finally {
                if (active) {
                    setIsSubmittingPayment(false);
                }
            }
        };

        void submitSinglePayment();

        return () => {
            active = false;
        };
    }, [initiated, initiatedTx, stepIndex]);

    // ✅ When last step completes, wait 2s then show TransactionFinalStatus
    useEffect(() => {
        if (stepIndex === steps.length - 1 && initiated) {
            const timer = setTimeout(() => {
                setShowFinal(isPrime(num));
                setStatus(true); // Or calculate prime check if needed
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [stepIndex, initiated]);

    const handleInitiate = () => {
        if (initiated || isSubmittingPayment) {
            return;
        }

        paymentSubmittedRef.current = false;
        batchIdFromPaymentRef.current = undefined;
        setInitiated(true);
        setStepIndex(0);
        setShowFinal(false);
    };

    const handleRefresh = () => {
        setStepIndex(0);
        setInitiated(false);
        setIsSubmittingPayment(false);
        setRandomNumber(null);
        setStatus(undefined);
        txAddedRef.current = false;
        completionHandledRef.current = false;
        paymentSubmittedRef.current = false;
        batchIdFromPaymentRef.current = undefined;
        setInitiatedTx(createInitiatedTransactionDraft(transaction));
        setBroadcastCompleted(false, {
            id: 0,
            broadcast: "",
            content: "",
            processed: false,
            receiver: "",
            sender: null,
            timestamp: ""
        }); // Reset broadcast state
    };

    if (!transaction || !transaction.fromBank) {
        return <Typography>No transaction data.</Typography>;
    }


    return (
        <Box
            minHeight={compact ? "auto" : "80vh"}   // 👈 remove tall height in batch mode
            display="flex"
            alignItems={compact ? "flex-start" : "center"}  // 👈 no vertical centering
            justifyContent="center"
            sx={{ mb: 1 }} // small bottom margin between cards
        >
            <Paper
                sx={{
                    p: 4,
                    borderRadius: 3,
                    boxShadow: "0 8px 40px 0 #44b9efcc",
                    width: 900,
                    maxWidth: "95vw",
                    position: "relative",
                }}
            ><Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h5" color="#555656ff" fontWeight={800}>
                            Payment Details
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        {!initiated && <Button
                            variant="contained"
                            color="error"
                            disabled={isSubmittingPayment}
                            onClick={() => {
                                setBroadcastCompleted(false, undefined);
                                navigate("/"); // ✅ send user back to dashboard or transactions list
                            }}
                        >
                            Cancel
                        </Button>}

                        {!initiated && (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleInitiate}
                                disabled={isSubmittingPayment}
                            >
                                Initiate Payment
                            </Button>
                        )}
                    </Box>
                </Box>
                {!showFinal && (
                    <Stepper
                        activeStep={initiated ? stepIndex : -1}
                        alternativeLabel
                        connector={<CustomConnector />}
                        sx={{
                            mb: 4,
                            "& .MuiStepLabel-label": { mt: 1, fontWeight: 600 },
                            "& .MuiStepIcon-root": {
                                color: "#e0e0e0", // grey inactive
                                fontSize: "2rem",
                                "&.Mui-active": { color: "#0fb0efff" },
                                "&.Mui-completed": { color: "#4caf50" }
                            }
                        }}
                    >
                        <Step completed={initiated && stepIndex > 0}>
                            <StepLabel>
                                <StatusBox
                                    active={initiated && stepIndex === 0}      // 🔵 Glow while active
                                    completed={initiated && stepIndex > 0}     // ✅ Green after completion
                                >
                                    <Typography fontWeight={600}>From:</Typography>
                                    <Typography>{initiatedTx?.fromBank}</Typography>
                                    <Typography fontWeight={600} mt={1}>Sent Amount:</Typography>
                                    <Typography> {initiatedTx?.amountSent.toLocaleString(undefined, {
                                        style: "currency",
                                        currency: "ZWG",
                                        minimumFractionDigits: 2,
                                    })}</Typography>
                                </StatusBox>
                            </StepLabel>
                        </Step>

                        <Step completed={initiated && stepIndex > 1}>
                            <StepLabel>
                                <StatusBox
                                    active={initiated && stepIndex === 1}      // 🔵 Glow while active
                                    completed={initiated && stepIndex > 1}     // ✅ Green after completion
                                >
                                    <Typography fontWeight={600} sx={{ fontSize: "20px" }}>Via Mastercard</Typography>
                                    <Typography mt={0.5} sx={{ fontSize: "12px" }}>Transaction FEE:</Typography>
                                    <Typography fontWeight={600}>{getFeeAmount().toLocaleString(undefined, {
                                        style: "currency",
                                        currency: "ZWG",
                                        minimumFractionDigits: 2,
                                    })}</Typography>
                                </StatusBox>
                            </StepLabel>

                        </Step>

                        <Step completed={initiated && stepIndex > 2}>
                            <StepLabel>
                                <StatusBox
                                    active={initiated && stepIndex === 2}      // 🔵 Glow while active
                                    completed={initiated && stepIndex > 2}     // ✅ Green after completion
                                >
                                    <Typography fontWeight={600}>To:</Typography>
                                    <Typography>{initiatedTx?.toBank}</Typography>
                                    <Typography fontWeight={600} mt={1}>Received Amount:</Typography>
                                    <Typography>  {initiatedTx?.amountReceived.toLocaleString(undefined, {
                                        style: "currency",
                                        currency: "ZAR",
                                        minimumFractionDigits: 2,
                                    })}</Typography>
                                    {isSubmittingPayment && (
                                        <Box mt={1} display="flex" justifyContent="center">
                                            <CircularProgress size={16} />
                                        </Box>
                                    )}
                                </StatusBox>
                            </StepLabel>
                        </Step>

                        <Step completed={initiated && stepIndex > 3}>
                            <StepLabel>
                                <StatusBox
                                    active={initiated && stepIndex === 3}      // 🔵 Glow while active
                                    completed={initiated && stepIndex > 3}     // ✅ Green after completion
                                >
                                    <Typography fontWeight={600}>Funds Received by:</Typography>
                                    <Typography>{initiatedTx?.payee}</Typography>
                                </StatusBox>
                            </StepLabel>
                        </Step>
                    </Stepper>
                )}

                {/* ✅ After final step completed, show TransactionFinalStatus */}
                {showFinal && (
                    <TransactionFinalStatus
                        status={status}
                        payee={initiatedTx.payee}
                        batchId={batchIdFromPaymentRef.current ?? initiatedTx.batchId}
                        transaction={{
                            amount: initiatedTx?.amountReceived.toLocaleString(undefined, {
                                style: "currency",
                                currency: "ZAR",
                                minimumFractionDigits: 2,
                            }) || "0.00",
                            currency: "ZAR", // Assuming ZAR for final amount
                        }}
                        randomNumber={randomNumber ?? undefined}
                        handleRefresh={handleRefresh}
                    />
                )}
            </Paper>
        </Box>
    );
};
