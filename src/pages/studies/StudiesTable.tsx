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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayIcon from "@mui/icons-material/Replay";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { fetchStudiesData } from "../../features/studies/studies-slice";
import { getStudyStatusColor } from "../../utils";
import ConfidenceChip from "../../components/shared/ConfidenceChip";
import { useIntl } from "react-intl";

interface StudiesTableProps {
  searchTerm?: string;
  onSelectStudy: (id: string) => void;
  onEditStudy?: (id: string) => void;
  onDeleteStudy?: (id: string) => void;
}

const patientNameFontSize = (name: string) => {
  if (name.length > 32) return "0.6875rem";
  if (name.length > 22) return "0.75rem";
  if (name.length > 16) return "0.8125rem";
  return "0.875rem";
};

const PatientNameText = ({ name }: { name: string }) => (
  <Typography
    component="span"
    sx={{
      display: "block",
      fontSize: patientNameFontSize(name),
      lineHeight: 1.35,
      wordBreak: "break-word",
      overflowWrap: "anywhere",
      whiteSpace: "normal",
    }}
  >
    {name}
  </Typography>
);

const StudiesTable = ({
  searchTerm = "",
  onSelectStudy,
  onEditStudy,
  onDeleteStudy,
}: StudiesTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const intl = useIntl();
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1, flexShrink: 0 }}>
        {intl.formatMessage({ id: "studies_list" })}
        <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
          ({filtered.length})
        </Typography>
      </Typography>

      <Card
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
          <Table stickyHeader size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: "16%" }}>
                  {intl.formatMessage({ id: "study_id" })}
                </TableCell>
                {!isMobile && (
                  <TableCell sx={{ fontWeight: "bold", width: "18%" }}>
                    {intl.formatMessage({ id: "patient_name" })}
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell sx={{ fontWeight: "bold", width: "16%" }}>
                    {intl.formatMessage({ id: "uploaded_at" })}
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: "bold", width: "22%" }}>
                  {intl.formatMessage({ id: "ai_result" })}
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                  {intl.formatMessage({ id: "status" })}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", width: "16%" }}>
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
                      verticalAlign: "top",
                      "&.Mui-selected": {
                        backgroundColor: `${theme.palette.primary.main}15`,
                      },
                    }}
                  >
                    <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "top" }}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {study.id}
                      </Typography>
                      {isMobile && (
                        <Box sx={{ mt: 0.5 }}>
                          <PatientNameText name={study.patientName} />
                        </Box>
                      )}
                    </TableCell>
                    {!isMobile && (
                      <TableCell sx={{ verticalAlign: "top" }}>
                        <PatientNameText name={study.patientName} />
                      </TableCell>
                    )}
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
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <ConfidenceChip
                          label={study.prediction.label}
                          confidence={study.prediction.confidence}
                        />
                        {study.review?.decision === "overridden" ? (
                          <Typography variant="caption" color="warning.main" fontWeight={600}>
                            {intl.formatMessage(
                              { id: "review_badge_overridden" },
                              { label: study.review.finalLabel }
                            )}
                          </Typography>
                        ) : study.review?.decision === "accepted" ? (
                          <Typography variant="caption" color="success.main" fontWeight={600}>
                            {intl.formatMessage({ id: "review_badge_accepted" })}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="info.main">
                            {intl.formatMessage({ id: "review_badge_pending" })}
                          </Typography>
                        )}
                      </Box>
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
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      {onEditStudy && (
                        <Tooltip title={intl.formatMessage({ id: "edit_study" })}>
                          <IconButton
                            size="small"
                            onClick={() => onEditStudy(study.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDeleteStudy && (
                        <Tooltip title={intl.formatMessage({ id: "delete_study" })}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteStudy(study.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
          sx={{ flexShrink: 0, overflow: "hidden" }}
        />
      </Card>
    </Box>
  );
};

export default StudiesTable;
