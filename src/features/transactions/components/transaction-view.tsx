import {
    Box,
    Button,
    Icon,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTransaction } from '@/features/transactions/api/get-transaction';
import { Spinner } from '@/components/ui/spinner/spinner';
import { useUser } from '@/lib/auth';
import { Backdrop, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close'

export const TransactionView = ({ payeeIdentity }: { payeeIdentity: string }) => {
    const transactionQuery = useTransaction({ payeeIdentity });
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [updatedBy, setUpdatedBy] = useState<string | undefined>(undefined);
    const [updatedDate, setUpdatedDate] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        setStatus(transactionQuery.data?.status);
        setUpdatedBy(transactionQuery.data?.updatedBy ?? undefined);
        setUpdatedDate(transactionQuery.data?.updatedDate ?? undefined);
    }, [transactionQuery.data]);

    const statusStyles: Record<'ACTIVE' | 'PENDING' | 'REJECTED', { color: string; background: string }> = {
        ACTIVE: { color: '#426834', background: '#eaf7e0' },
        PENDING: { color: '#fbc02d', background: '#FFFDE7' },
        REJECTED: { color: '#BA1A1A', background: '#FFE8E8' },
    };

    const user = useUser();
    const updatedByData = user?.data ? `${user.data.firstname} ${user.data.lastname}: ${user.data.id}` : '';

    if (transactionQuery.isLoading) return <Spinner />;
    const transactionData = transactionQuery.data;
    if (!transactionData) return null;

    // List all fields to display, with friendly labels
    const fields: { label: string; key: keyof typeof transactionData }[] = [
        { label: 'Payee Identity', key: 'payeeIdentity' },
        { label: 'Payment Modality', key: 'paymentModality' },
        { label: 'Banking Institution Code', key: 'bankingInstitutionCode' },
        { label: 'Financial Address', key: 'financialAddress' },
        { label: 'First Name', key: 'firstName' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Date Of Birth', key: 'dateOfBirth' },
        { label: 'Gender', key: 'gender' },
        { label: 'Nationality', key: 'nationality' },
        { label: 'Primary Document Type', key: 'primaryDocumentType' },
        { label: 'Primary Document Number', key: 'primaryDocumentNumber' },
        { label: 'Primary Document Country', key: 'primaryDocumentCountry' },
        { label: 'Primary Document Expiry', key: 'primaryDocumentExpiry' },
        { label: 'Secondary Document Type', key: 'secondaryDocumentType' },
        { label: 'Secondary Document Number', key: 'secondaryDocumentNumber' },
        { label: 'Tax Identification Number', key: 'taxIdentificationNumber' },
        { label: 'Phone Number Primary', key: 'phoneNumberPrimary' },
        { label: 'Phone Number Secondary', key: 'phoneNumberSecondary' },
        { label: 'Email Address Primary', key: 'emailAddressPrimary' },
        { label: 'Email Address Secondary', key: 'emailAddressSecondary' },
        { label: 'Preferred Contact Method', key: 'preferredContactMethod' },
        { label: 'Language Preference', key: 'languagePreference' },
        { label: 'Current Address Line 1', key: 'currentAddressLine1' },
        { label: 'Current Address Line 2', key: 'currentAddressLine2' },
        { label: 'Current City', key: 'currentCity' },
        { label: 'Current State/Province', key: 'currentStateProvince' },
        { label: 'Current Postal Code', key: 'currentPostalCode' },
        { label: 'Current Country', key: 'currentCountry' },
        { label: 'Home Address Line 1', key: 'homeAddressLine1' },
        { label: 'Home Address Line 2', key: 'homeAddressLine2' },
        { label: 'Home City', key: 'homeCity' },
        { label: 'Home State/Province', key: 'homeStateProvince' },
        { label: 'Home Postal Code', key: 'homePostalCode' },
        { label: 'Home Country', key: 'homeCountry' },
        { label: 'Emergency Contact Name', key: 'emergencyContactName' },
        { label: 'Emergency Contact Relationship', key: 'emergencyContactRelationship' },
        { label: 'Emergency Contact Phone', key: 'emergencyContactPhone' },
        { label: 'Emergency Contact Email', key: 'emergencyContactEmail' },
        { label: 'Emergency Contact Address', key: 'emergencyContactAddress' },
        { label: 'Monthly Pension Amount', key: 'monthlyPensionAmount' },
        { label: 'Currency Preference', key: 'currencyPreference' },
        { label: 'Payment Frequency', key: 'paymentFrequency' },
        { label: 'Bank Name', key: 'bankName' },
        { label: 'Bank Branch', key: 'bankBranch' },
        { label: 'Account Holder Name', key: 'accountHolderName' },
        { label: 'Pension Start Date', key: 'pensionStartDate' },
        { label: 'Last Employment Date', key: 'lastEmploymentDate' },
        { label: 'Pension Type', key: 'pensionType' },
        { label: 'Service Years', key: 'serviceYears' },
        { label: 'Last Review Date', key: 'lastReviewDate' },
        { label: 'Next Review Date', key: 'nextReviewDate' },
        { label: 'Emigration Date', key: 'emigrationDate' },
        { label: 'Residence Permit Number', key: 'residencePermitNumber' },
        { label: 'Residence Permit Expiry', key: 'residencePermitExpiry' },
        { label: 'Tax Treaty Applicable', key: 'taxTreatyApplicable' },
        { label: 'Withholding Tax Rate', key: 'withholdingTaxRate' },
        { label: 'Compliance Status', key: 'complianceStatus' },
        { label: 'Last Verification Date', key: 'lastVerificationDate' },
        { label: 'Created By', key: 'createdBy' },
        { label: 'Created Date', key: 'createdDate' },
        { label: 'Updated By', key: 'updatedBy' },
        { label: 'Updated Date', key: 'updatedDate' },
        { label: 'Version', key: 'version' },
    ];

    const displayedStatus = status ?? transactionData.status;

    const handleChangeStatus = (newStatus: string) => {
        setStatus(newStatus);
        setUpdatedBy(updatedByData);
        setUpdatedDate(new Date().toISOString());
        // TODO: Call your API mutation here
        //  updateTransactionStatus(payeeIdentity, newStatus, updatedBy, updatedDate); 
        // add note API call to update the transaction status reason why
        // Optionally show a notification
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
    const handleSendOrder = () => {
        setIsSending(true);
        setIsSending(false);
        // Pass the payment details to the new page
        navigate('/transaction-roadmap', {
            state: {
                payeeIdentity: transactionData.payeeIdentity,
                payeeMsisdn: transactionData.phoneNumberPrimary,
                fromBank: transactionData.bankName,
                fromCountry: transactionData.currentCountry,
                fromAccount: transactionData.financialAddress,
                toBank: transactionData.bankName, // or a specific field for destination bank
                toCountry: transactionData.homeCountry,
                toAccount: transactionData.financialAddress,
                via: "Mastercard",
                amount: transactionData.monthlyPensionAmount,
                currency: transactionData.currencyPreference,
                payee: `${transactionData.firstName} ${transactionData.lastName}`,
            }
        });
    };

    return (
        <Paper
            sx={{
                backgroundColor: '#ffffff',
                border: '1px solid #d4f5f6ff',
                borderRadius: 3,
                padding: { xs: 1.5, sm: 3 },
                mt: 2,
                width: '100%',
                maxWidth: 900,
                mx: 'auto',
                boxShadow: '0 4px 24px 0 rgba(66,104,52,0.10)', // gentle shadow with your theme green
                transition: 'box-shadow 0.2s',
            }}
        >

            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700} color="#4d5051ff">
                    Review View
                </Typography>
                {status === "PENDING" && <IconButton
                    aria-label="Close"
                    onClick={() => {
                        // ✅ first reset the state
                        navigate(-1);       // ✅ then go back to homepage (or any route)
                    }}
                    sx={{
                        position: 'relative',
                        top: 8,
                        left: "auto",
                        color: '#333',        // darker so it’s visible
                        zIndex: 999,          // highest priority
                        backgroundColor: 'rgba(255,255,255,0.8)', // optional: light background circle
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,1)',
                        }
                    }}
                >
                    <CloseIcon fontSize="medium" />
                </IconButton>
                }
                {/* <Box display="flex" alignItems="center" gap={1}>
                    {displayedStatus === "REJECTED" && (
                        <>
                            <Icon color="error" baseClassName="material-symbols-outlined">cancel</Icon>
                            <Typography color="error" fontWeight={600}>{handleDecodeStatus(displayedStatus)}</Typography>
                        </>
                    )}
                    {displayedStatus === "PENDING" && (
                        <>
                            <Icon sx={{ color: '#fbc02d' }} baseClassName="material-symbols-outlined">pending</Icon>
                            <Typography sx={{ color: '#fbc02d', fontWeight: 600 }}>{handleDecodeStatus(displayedStatus)}</Typography>
                        </>
                    )}
                    {displayedStatus === "ACTIVE" && (
                        <>
                            <Icon color="success" baseClassName="material-symbols-outlined">check_circle</Icon>
                            <Typography color="success.main" fontWeight={600}>{handleDecodeStatus(displayedStatus)}</Typography>
                        </>
                    )}
                </Box> */}
            </Box>

            <Box display="flex" justifyContent="space-between" gap={1} mt={3}>
                <Box display="flex" gap={1}>
                    {status !== "PENDING" && <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            navigate("/transactions");
                        }}
                        startIcon={<Icon baseClassName="material-symbols-outlined">cancel</Icon>}
                        sx={{ boxShadow: 1 }}
                    >
                        Reject
                    </Button>}

                    {/* {status !== "PENDING" && status !== "ACTIVE" && <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleChangeStatus('ACTIVE')}
                        startIcon={<Icon baseClassName="material-symbols-outlined">check_circle</Icon>}
                        sx={{ boxShadow: 1 }}
                    >
                        Active
                    </Button>} */}
                    {status !== "PENDING" && <Button
                        variant="contained"
                        color="success"
                        onClick={handleSendOrder}
                        sx={{ fontWeight: 600, minWidth: 150 }}
                    >
                        Approve
                    </Button>}

                </Box>

            </Box>

            <TableContainer sx={{
                mt: 2,
                borderRadius: 2,
                border: '1px solid #d4f5f6ff',
                overflow: 'hidden',
                boxShadow: '0 1px 5px 0 #d4f5f6ff'
            }}>
                <Table size="small" sx={{ minWidth: 400 }}>
                    <TableBody>
                        {fields.map(({ label, key }, idx) => {
                            const isStatusRow = label === 'Status';
                            const isUpdatedByRow = label === 'Updated By';
                            const isUpdatedDateRow = label === 'Updated Date';
                            let value;
                            if (isStatusRow) value = status ?? transactionData.status;
                            else if (isUpdatedByRow) value = updatedBy ?? '-';
                            else if (isUpdatedDateRow) value = updatedDate ? new Date(updatedDate).toLocaleString() : '-';
                            else value = transactionData[key];

                            //    const safeStatus = (value === 'ACTIVE' || value === 'PENDING' || value === 'REJECTED') ? value : undefined;
                            //    const colorStyle = isStatusRow && safeStatus ? statusStyles[safeStatus] : {};

                            return (
                                <TableRow
                                    key={label}
                                    sx={{
                                        backgroundColor: idx % 2 === 0 ? '#FAFAF7' : '#ffffff',
                                        '&:last-child td': { borderBottom: 0 }
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            fontWeight: isStatusRow ? 700 : 500,
                                            width: 240,
                                            borderRight: '1px solid #F0F2EB',
                                            //    ...colorStyle
                                        }}
                                    >
                                        {label}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: isStatusRow ? 700 : 400,
                                            //    ...colorStyle
                                        }}
                                    >
                                        {value !== undefined && value !== null ? String(value) : '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="space-between" gap={1} mt={3}>


                <Button
                    variant="text"
                    startIcon={
                        <Icon baseClassName="material-symbols-outlined" sx={{ fontVariationSettings: "'FILL' 1" }}>
                            download
                        </Icon>
                    }
                >
                    Download as PDF
                </Button>
            </Box>

        </Paper>
    );
};
