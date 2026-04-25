import {
  Box,
  Checkbox,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Icon,
} from '@mui/material';
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useInitiatedTransactions } from '@/hooks/initiated-transactions';
import { paths } from '@/config/paths';

export const TransactionsInitiatedTable = () => {
  const { transactionsInitiated } = useInitiatedTransactions();
  const [selected, setSelected] = useState<string[]>([]);

  const isAllSelected = transactionsInitiated.length > 0 && selected.length === transactionsInitiated.length;

  // Handle header checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(transactionsInitiated.map((tx) => tx.payeeIdentity));
    } else {
      setSelected([]);
    }
  };

  // Handle row checkbox
  const handleSelectRow = (payeeIdentity: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected((prev) =>
      event.target.checked
        ? [...prev, payeeIdentity]
        : prev.filter((id) => id !== payeeIdentity)
    );
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: '#d4f5f6ff' }}>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selected.length > 0 && selected.length < transactionsInitiated.length}
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Batch ID</TableCell>
            <TableCell>Payee Identity</TableCell>
            <TableCell>Beneficiary Name</TableCell>
            <TableCell>Duration (s)</TableCell>
            <TableCell>From Bank</TableCell>
            <TableCell>To Bank</TableCell>
            <TableCell>Transaction Fee</TableCell>
            <TableCell>Amount Sent</TableCell>
            <TableCell>Amount Received</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactionsInitiated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} align="center">
                <Box sx={{ my: 8 }}>
                  <Typography>No initiated transactions yet.</Typography>
                  <Typography fontSize={14} sx={{ opacity: 0.8 }}>
                    New initiated transactions will appear here.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            transactionsInitiated.map((row) => (
              <TableRow key={row.payee} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(row.payee)}
                    onChange={handleSelectRow(row.payee)}
                  />
                </TableCell>
                <TableCell>
                  {/* Simple color-coded status */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    {row.status === 'COMPLETED' && (
                      <Icon color="success" baseClassName="material-symbols-outlined">check_circle</Icon>
                    )}
                    {row.status === 'FAILED' && (
                      <Icon color="error" baseClassName="material-symbols-outlined">cancel</Icon>
                    )}
                    {row.status === 'IN_PROGRESS' && (
                      <Icon sx={{ color: '#fbc02d' }} baseClassName="material-symbols-outlined">autorenew</Icon>
                    )}
                    <Typography variant="body2" fontWeight={600}>
                      {row.status.replace('_', ' ')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{row.batchId ?? '-'}</TableCell>
                <TableCell>
                  {row.payeeIdentity}
                </TableCell>
                <TableCell>
                  {row.payee}
                </TableCell>
                <TableCell>{row.duration}</TableCell>
                <TableCell>{row.fromBank}</TableCell>
                <TableCell>{row.toBank}</TableCell>
                <TableCell>
                  {row.transactionFee.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'ZWG',
                  })}
                </TableCell>
                <TableCell>
                  {row.amountSent.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'ZWG',
                  })}
                </TableCell>
                <TableCell>
                  {row.amountReceived.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'ZAR',
                  })}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    component={Link}
                    to={paths.app.transactionInitiated.getHref(row.payeeIdentity)}
                  >
                    <Icon baseClassName="material-symbols-outlined">visibility</Icon>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
