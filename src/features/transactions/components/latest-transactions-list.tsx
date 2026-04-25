// src/features/transactions/components/latest-transactions-list.tsx

import React from "react";
import {
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
} from "@mui/material";
import { useInitiatedTransactions } from "@/hooks/initiated-transactions";

export const LatestTransactionsList = () => {
    const { transactionsInitiated } = useInitiatedTransactions();
    // Show only the 5 most recent
    const latest = transactionsInitiated.slice(0, 5);

    if (latest.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography>No payments yet.</Typography>
            </Paper>
        );
    }

    // Helper for status color
    const statusColor = (status: string) => {
        if (status === "COMPLETED") return "success";
        if (status === "FAILED") return "error";
        if (status === "IN_PROGRESS") return "warning";
        return "default";
    };

    return (
        <Paper sx={{ p: 0 }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ background: "#d4f5f6ff" }}>
                        <TableCell>Status</TableCell>
                        <TableCell>Beneficiary Name</TableCell>
                        <TableCell>Amount Received</TableCell>
                        <TableCell>Time of Transaction</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {latest.map((tx) => (
                        <TableRow key={tx.payeeIdentity}>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={tx.status.replace("_", " ")}
                                    color={statusColor(tx.status)}
                                    sx={{ fontWeight: 500, textTransform: "capitalize" }}
                                />
                            </TableCell>
                            <TableCell>
                                {tx.payee}
                            </TableCell>
                            <TableCell>
                                {tx.amountReceived.toLocaleString(undefined, {
                                    style: "currency",
                                    currency: "ZAR",
                                })}
                            </TableCell>
                            <TableCell>
                                {new Date(tx.executionDate).toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
};
