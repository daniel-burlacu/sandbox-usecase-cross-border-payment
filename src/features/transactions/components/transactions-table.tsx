import {
  Badge,
  Box,
  Checkbox,
  Chip,
  ChipProps,
  Divider,
  FormControlLabel,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CountryFlag from 'react-country-flag';
import { useUser } from '@/lib/auth';
import { paths } from '@/config/paths';
import { useTransactions } from '@/features/transactions/api/get-transactions';
// import { usetransaction } from '@/lib/auth';
import { Beneficiary, InitiatedTransaction } from '@/types/api';

import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { SvgIcon } from '@mui/material';
import { useInitiatedTransactions } from "@/hooks/initiated-transactions";
import { getFXRateZWGFtoZAR, convertZWGtoZAR, getFeeAmount } from '@/utils/transactionConversions';
import { getFXRateUSDtoZAR } from '@/utils/transactionConversions';

export type TransactionsTableProps = {
  initialRowsPerPage: number;
  sort: string;
  showPagination?: boolean;
  showFilters?: boolean;
  showCheckBox?: boolean;
};

export const TransactionsTable = ({
  initialRowsPerPage,
  sort,
  showPagination = true,
  showFilters = false,
  showCheckBox
}: TransactionsTableProps) => {
  const normalizeMsisdn = (value: string): string => value.replace(/[+\-\s()]/g, '');
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
  });

  // Check state for checkboxes
  const [checkedRows, setCheckedRows] = useState<{ [key: string]: boolean }>({});

  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [filterRejectedOnly, setFilterRejectedOnly] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);
  const [filterWithinJurisdiction, setFilterWithinJurisdiction] = useState(true);
  const { transactionsInitiated: initiatedTransactions } = useInitiatedTransactions();
  const navigate = useNavigate();
  const user = useUser();

  //1ZWL = 0.05594 ZAR



  const handleCountryToCourency = (country: string): string => {
    switch (country) {
      case 'ZWL':
        return 'ZWG'; // Zimbabwe Gold
      case 'ZAF':
        return 'ZAR'; // South African Rand
      case 'USA':
        return 'USD'; // US Dollar
      default:
        return 'USD'; // Default to USD if unknown
    }
  };

  const getIssueIcon = (status: string) => {
    if (status === 'ACTIVE') {
      // Green filled box, white check
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
      );
    }
    if (status === 'REJECTED') {
      // Red triangle, black exclamation
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Triangle SVG with exclamation */}
          <SvgIcon sx={{ fontSize: 32, color: 'error.main' }} viewBox="0 0 24 24">
            <polygon points="12,2 22,20 2,20" />
            <text x="12" y="17" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">!</text>
          </SvgIcon>
        </Box>
      );
    }
    if (status === 'PENDING') {
      // Yellow rounded circle, black exclamation
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'warning.main',
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningAmberIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
        </Box>
      );
    }
    // Default empty
    return null;
  };

  const isoMap: Record<string, string> = {
    ZWE: 'ZW',
    ZAF: 'ZA',
    // add more as needed
  };

  const countryFlag = (code: string, style = {}) => (
    <CountryFlag
      countryCode={code}
      svg
      style={{
        width: '1.6em',
        height: '1.6em',
        borderRadius: '3px',
        boxShadow: '0 0 1px #aaa',
        ...style,
      }}
      title={code}
    />
  );
  const transactiosQuery = useTransactions({
    country: filterWithinJurisdiction ? "ZWE" : undefined,
    rejected: filterRejectedOnly,
    pending: filterPendingOnly,
    active: filterActiveOnly,
    page: page + 1,
    size: rowsPerPage,
    sort: sort as keyof Beneficiary,
  });

  useEffect(() => {
    if (transactiosQuery.data) {
      // First, get a Set of all payeeIdentities in initiatedTransactions for fast lookup
      const initiatedIds = new Set(
        initiatedTransactions.map(tx => tx.payeeIdentity)
      );

      const safeRows = transactiosQuery.data.content
        .filter(item => !initiatedIds.has(item.payeeIdentity)) // <--- EXCLUDE IF EXISTS
        .map(item => ({
          ...item,
          gender: ['M', 'F', 'O'].includes(item.gender) ? item.gender : 'O',
          status: ['ACTIVE', 'PENDING', 'REJECTED'].includes(item.status)
            ? item.status
            : 'ACTIVE',
        }));

      setRows(safeRows);
      setPagination({
        totalElements: transactiosQuery.data.totalElements,
        totalPages: transactiosQuery.data.totalPages,
      });
    }
  }, [transactiosQuery.data, initiatedTransactions]);

  useEffect(() => {
    // Set initial checked states if needed
    const initial: { [id: string]: boolean } = {};
    rows.forEach(row => {
      initial[row.payeeIdentity] = row.status === "ACTIVE";
    });
    setCheckedRows(initial);
  }, [rows]);



  const filterOpen = Boolean(filterAnchorEl);

  const handleFilterButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    //  setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    //  setFilterAnchorEl(null);
  };

  const handleSendOrder = (transactionData: Beneficiary) => {
    // Fill or calculate any missing fields as needed!
    const state: InitiatedTransaction = {
      payeeIdentity: transactionData.payeeIdentity,
      correlationId: '',
      payeeMsisdn: normalizeMsisdn(transactionData.phoneNumberPrimary),
      payee: `${transactionData.firstName} ${transactionData.lastName}`,
      duration: 0, // Placeholder, or calculate if available
      executionDate: new Date().toISOString(), // Now, or from your data
      fromBank: transactionData.bankName, // adjust if you have a specific field
      toBank: transactionData.bankName,   // adjust if you have a specific field
      fxRateToUSD: getFXRateUSDtoZAR() ?? 1, // Provide default or use from Beneficiary if available
      fxRateToZar: getFXRateZWGFtoZAR() ?? 1, // Provide default or use from Beneficiary if available
      transactionFee: getFeeAmount() ?? 0, // Calculate or fetch if needed
      amountSent: transactionData.monthlyPensionAmount ?? 0,
      amountReceived: convertZWGtoZAR(transactionData.monthlyPensionAmount, getFXRateZWGFtoZAR()) ?? 0, // Or calculated amount minus fees
      status: "IN_PROGRESS" // or use a status from Beneficiary if available
    };

    navigate('/transaction-roadmap', { state });
  };

  const handleFilterWithinJurisdictionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterWithinJurisdiction(event.target.checked);
    setPage(0);
  };
  const handleFilterPendingOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterPendingOnly(event.target.checked);
    setPage(0);
  };
  const handleFilterRejectedOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterRejectedOnly(event.target.checked);
    setPage(0);
  };

  const handleFilterActiveOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterActiveOnly(event.target.checked);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const activeFiltersCount = [filterPendingOnly, filterRejectedOnly, filterActiveOnly].filter(Boolean).length;
  const fee = 0.05; // Example fee, replace with actual logic if needed

  const handleApplyFees = (amount: number) => {
    return amount - amount * fee;
  };

  const handleDecodeStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'READY FOR PAYMENT';
      case 'PENDING':
        return 'WAITING FOR REVIEW';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'Unknown';
    }
  }

  // Status Chip color logic
  const getStatusChip = (status: string) => {
    let color: ChipProps["color"] = "default";
    if (status === "ACTIVE") color = "success";
    else if (status === "PENDING") color = "warning";
    else if (status === "REJECTED") color = "error";
    return (
      <Chip
        size="small"
        label={handleDecodeStatus(status)}
        color={color}
        sx={{ fontWeight: 500, textTransform: "capitalize" }}
      />
    );
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} size="small">
        <TableHead>
          {showFilters && (
            <TableRow sx={{ backgroundColor: '#D4F5F6FF' }}> {/* D4F5F6FF */}
              <TableCell colSpan={12} sx={{ py: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontSize={20}>Outstanding Pension Payments List</Typography>
                  <IconButton
                    onClick={handleFilterButtonClick}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    <Badge
                      badgeContent={activeFiltersCount}
                      sx={{ '& .MuiBadge-badge': { backgroundColor: '#0fb0efff', color: 'white' } }}
                    >
                      <Icon baseClassName="material-symbols-outlined" sx={{ color: '#386667' }}>
                        filter_list
                      </Icon>
                    </Badge>
                  </IconButton>
                  <Menu
                    anchorEl={filterAnchorEl}
                    open={filterOpen}
                    onClose={handleFilterClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    slotProps={{
                      paper: {
                        elevation: 0,
                        sx: {
                          overflow: 'visible',
                          filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.32))',
                          mt: 0.5,
                          '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disableRipple={true}
                            checked={filterWithinJurisdiction}
                            onChange={handleFilterWithinJurisdictionChange}
                          />
                        }
                        label="Within Jurisdiction"
                      />
                    </MenuItem>
                    <MenuItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disableRipple={true}
                            checked={filterRejectedOnly}
                            onChange={handleFilterRejectedOnlyChange}
                          />
                        }
                        label="Rejected Only"
                      />
                    </MenuItem>
                    <MenuItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disableRipple={true}
                            checked={filterPendingOnly}
                            onChange={handleFilterPendingOnlyChange}
                          />
                        }
                        label="Waiting for Review Only"
                      />
                    </MenuItem>
                    <MenuItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={filterActiveOnly}
                            onChange={handleFilterActiveOnlyChange}
                          />
                        }
                        label="Ready for Payment Only"
                      />
                    </MenuItem>
                  </Menu>
                </Box>
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Beneficiary Name</TableCell>
            <TableCell>Payee ID</TableCell>
            <TableCell>Country Route</TableCell>
            <TableCell>Transaction Fee</TableCell>
            <TableCell>Pension Amount</TableCell>
            <TableCell>FX Rate</TableCell>
            <TableCell>Amount to be Received</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        {rows.length > 0 ? (
          <>
            <TableBody>
              {rows.map((row) => {
                const dueDate = row.nextReviewDate || row.pensionStartDate || "";
                // const dueDateObj = dueDate ? new Date(dueDate) : null;
                // const now = new Date();
                // const daysPending =
                //   dueDateObj ? Math.max(0, Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : "-";
                return (
                  <TableRow key={row.payeeIdentity}>
                    <TableCell>
                      {getStatusChip(row.status)}
                    </TableCell>
                    {/* Beneficiary Name */}
                    <TableCell>
                      {row.firstName} {row.middleName} {row.lastName}
                    </TableCell>
                    {/* Payee ID */}
                    <TableCell>{row.payeeIdentity}</TableCell>
                    {/* Country Route (with flags) */}
                    <TableCell>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {countryFlag(isoMap[row.nationality])}
                        <span style={{ margin: '0 6px' }}>→</span>
                        {countryFlag(isoMap[row.currentCountry])}
                      </span>
                      <Typography component="div" variant="body2" sx={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                        {row.homeCountry || row.nationality}
                        <Box sx={{ width: 13, display: 'inline-block' }} />

                        <Box sx={{ width: 13, display: 'inline-block' }} />
                        {row.currentCountry}
                      </Typography>
                    </TableCell>
                    {/* Transaction Fee */}
                    <TableCell>
                      {getFeeAmount()?.toLocaleString(undefined, {
                        style: "currency",
                        currency: "ZWG",
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    {/* Sent amount */}
                    <TableCell>
                      {row.monthlyPensionAmount?.toLocaleString(undefined, {
                        style: "currency",
                        currency: handleCountryToCourency(row.currencyPreference) || "ZiG",
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {getFXRateZWGFtoZAR().toFixed(4)}
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      {convertZWGtoZAR(row.monthlyPensionAmount, getFXRateZWGFtoZAR()).toLocaleString(undefined, {
                        style: "currency",
                        currency: "ZAR",
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    {/* Due Date */}
                    {/* Days Pending */}
                    {/* <TableCell>{daysPending}</TableCell> */}
                    {/* Actions */}
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleSendOrder(row)}
                      >
                        <Icon baseClassName="material-symbols-outlined"><PaymentsIcon /></Icon>
                      </IconButton>
                      {/* <IconButton size="small">
                        <Icon baseClassName="material-symbols-outlined">edit</Icon>
                      </IconButton> */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {showPagination && (
              <TableFooter>
                <TableRow sx={{ border: 0 }}>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    colSpan={10}
                    count={pagination.totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableRow>
              </TableFooter>
            )}
          </>
        ) : (
          <TableBody>
            <TableRow>
              <TableCell colSpan={10}>
                <Box
                  sx={{
                    my: '128px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Icon
                    baseClassName="material-symbols-outlined"
                    sx={{ mx: 'auto', fontSize: 48, color: '#0fb0efff' }}
                  >
                    search
                  </Icon>
                  <Typography>No outstanding pension payments to show</Typography>
                  <Typography fontSize={14}>
                    New outstanding pension payments will appear here when they are reported. Monitor this space for
                    updates.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
};
