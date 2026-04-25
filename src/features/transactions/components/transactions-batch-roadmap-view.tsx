import { Box, Typography } from "@mui/material";
import { useTransactions } from "@/features/transactions/api/get-transactions";
import { TransactionRoadmap } from "@/features/transactions/components/transaction-roadmap-view";
import { useInitiatedTransactions } from "@/hooks/initiated-transactions";
import { useMemo } from "react";
import { InitiatedTransaction } from "@/types/api";
import {
    convertZWGtoZAR,
    getFeeAmount,
    getFXRateUSDtoZAR,
    getFXRateZWGFtoZAR,
    getFXRateZWGtoUSD,
} from "@/utils/transactionConversions";

export const TransactionsBatchRoadmapView = () => {
    const { data, isLoading } = useTransactions({ page: 1, size: 9999 });
    const { transactionsInitiated } = useInitiatedTransactions();

    // ✅ Create a Set of already-initiated Payee IDs for fast lookup
    const initiatedIds = useMemo(
        () => new Set(transactionsInitiated.map((tx) => tx.payeeIdentity)),
        [transactionsInitiated]
    );

    // ✅ Filter ACTIVE transactions that are NOT already initiated
    const readyTransactions = useMemo(() => {
        if (!data) return [];

        return data.content.filter(
            (tx) => tx.status === "ACTIVE" && !initiatedIds.has(tx.payeeIdentity)
        );
    }, [data, initiatedIds]);

    if (isLoading) {
        return (
            <Box p={4}>
                <Typography>Loading transactions...</Typography>
            </Box>
        );
    }

    return (
        <Box p={4}>
            {readyTransactions.length > 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" gap={0} mt={0}>
                    {readyTransactions.map((tx) => {
                        // 🔄 Transform each transaction to match InitiatedTransaction type
                        const transformedTx: InitiatedTransaction = {
                            payeeIdentity: tx.payeeIdentity,
                            correlationId: crypto.randomUUID(),
                            payeeMsisdn: tx.phoneNumberPrimary,
                            payee: `${tx.firstName} ${tx.lastName}`,
                            duration: 0,
                            executionDate: new Date().toISOString(),
                            fromBank: tx.bankName || "Unknown Bank",
                            toBank: tx.bankName || "Unknown Bank",
                            fxRateToUSD: getFXRateZWGtoUSD(),
                            fxRateToZar: getFXRateUSDtoZAR(),
                            transactionFee: getFeeAmount(),
                            amountSent: tx.monthlyPensionAmount,
                            amountReceived: convertZWGtoZAR(tx.monthlyPensionAmount, getFXRateZWGFtoZAR()),
                            status: "ACTIVE",
                        };

                        return (
                            <TransactionRoadmap
                                key={tx.payeeIdentity}
                                propTransaction={transformedTx}
                                compact
                            />
                        );
                    })}
                </Box>
            ) : (
                <Typography mt={2}>✅ No transactions ready for payment.</Typography>
            )}
        </Box>
    );
};
