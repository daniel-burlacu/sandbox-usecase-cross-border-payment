import { Box, IconButton, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import { useLocation, useNavigate } from "react-router-dom"

type TransactionFinalStatusProps = {
  status: boolean | undefined,
  payee: string,
  transaction: {
    amount: string,
    currency: string
  },
  randomNumber?: number;
  /** Batch id from payment API (`PollingPath`), shown when payment completes successfully. */
  batchId?: string;
  handleRefresh?: () => void;
}

const TransactionFinalStatus = ({ status, payee, transaction, randomNumber, batchId, handleRefresh }: TransactionFinalStatusProps) => {
  const navigate = useNavigate();
  if (status === undefined) {
    // Optionally show a spinner or some placeholder
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={2} mb={2}>
        <Typography variant="h6" fontWeight={700} color="#4caf50">
          Processing Payment...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {status && <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={2} mb={2}>
        <CheckCircleIcon sx={{ fontSize: 80, color: status ? "#4caf50" : "#BA1A1A" }} />
        <IconButton
          aria-label="Close"
          onClick={() => {
            if (handleRefresh) handleRefresh();       // ✅ first reset the state
            navigate("/");       // ✅ then go back to homepage (or any route)
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
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
        <Typography variant="h6" fontWeight={700} color={status ? "#4caf50" : "#BA1A1A"}>
          Payment {status ? "Completed" : "Failed"}!
        </Typography>
        {batchId ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            <strong>Batch ID:</strong> {batchId}
          </Typography>
        ) : null}
        <Typography>
          <strong>Funds Received by:</strong> {payee}
        </Typography>
        <Typography>
          <strong>Amount:</strong> {transaction.amount}
        </Typography>
        {randomNumber !== undefined && (
          <Typography sx={{ mt: 1 }}>
            <strong>Payment ID:</strong> {randomNumber}
          </Typography>
        )}
      </Box>
      }
      {!status &&
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={2} mb={2}>
          <CheckCircleIcon sx={{ fontSize: 80, color: status ? "#4caf50" : "#BA1A1A" }} />
          <Typography variant="h6" fontWeight={700} color={status ? "#4caf50" : "#BA1A1A"}>
            Payment {status ? "Completed" : "Failed"}!
          </Typography>
          <Typography>
            <strong>We are sorry but the payment could not be processed at this moment, please try again later !</strong>
          </Typography>
        </Box>
      }
    </>
  );
};

export default TransactionFinalStatus;