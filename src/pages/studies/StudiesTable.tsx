import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  LinearProgress,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../store/store";
import { fetchStudiesData } from "../../features/studies/studies-slice";
import { getStudyStatusColor } from "../../utils";
import ConfidenceChip from "../../components/shared/ConfidenceChip";
import { useIntl } from "react-intl";

interface StudiesTableProps {
  searchTerm?: string;
  onSelectStudy: (id: string) => void;
}

const StudiesTable = ({
  searchTerm = "",
  onSelectStudy,
}: StudiesTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const intl = useIntl();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { studies, loading, selectedStudyId, error } = useSelector(
    (state: RootState) => state.studies
  );

  const studiesArray = Object.values(studies);
  const filtered = studiesArray.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prediction.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LinearProgress />;
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            size="small"
            startIcon={<ReplayIcon />}
            onClick={() => dispatch(fetchStudiesData())}
          >
            {intl.formatMessage({ id: "retry" })}
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (filtered.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ p: 2, textAlign: "center" }}>
        {intl.formatMessage({ id: "no_studies_found" })}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {intl.formatMessage({ id: "studies_list" })}
        <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
          ({filtered.length})
        </Typography>
      </Typography>

      <Card variant="outlined" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>
                  {intl.formatMessage({ id: "study_id" })}
                </TableCell>
                {!isMobile && (
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {intl.formatMessage({ id: "patient_name" })}
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {intl.formatMessage({ id: "uploaded_at" })}
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: "bold" }}>
                  {intl.formatMessage({ id: "ai_result" })}
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  {intl.formatMessage({ id: "status" })}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {intl.formatMessage({ id: "actions" })}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((study) => (
                  <TableRow
                    key={study.id}
                    hover
                    selected={study.id === selectedStudyId}
                    onClick={() => onSelectStudy(study.id)}
                    sx={{
                      cursor: "pointer",
                      "&.Mui-selected": {
                        backgroundColor: `${theme.palette.primary.main}15`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {study.id}
                      </Typography>
                      {isMobile && (
                        <Typography variant="caption" color="textSecondary">
                          {study.patientName}
                        </Typography>
                      )}
                    </TableCell>
                    {!isMobile && <TableCell>{study.patientName}</TableCell>}
                    {!isMobile && (
                      <TableCell>
                        {intl.formatDate(new Date(study.uploadedAt), {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    )}
                    <TableCell>
                      <ConfidenceChip
                        label={study.prediction.label}
                        confidence={study.prediction.confidence}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: `${getStudyStatusColor(study.status)}22`,
                          color: getStudyStatusColor(study.status),
                          fontWeight: 600,
                        }}
                      >
                        {intl.formatMessage({
                          id: `study_status_${study.status.toLowerCase()}`,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={intl.formatMessage({ id: "view_details" })}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudy(study.id);
                            navigate(`/studies/${study.id}`);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
    </Box>
  );
};

export default StudiesTable;
