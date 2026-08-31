import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../store/store";
import {
  fetchStudiesData,
  removeStudy,
  selectStudy,
  updateStudyFields,
} from "../../features/studies/studies-slice";
import SearchFilter from "../../components/shared/SearchFilter";
import StudiesTable from "./StudiesTable";
import StudyDetailCard from "./StudyDetailCard";
import StudyEditDialog, { StudyEditValues } from "./StudyEditDialog";

const StudiesWorklist = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { studies, selectedStudyId, mutating } = useSelector(
    (state: RootState) => state.studies
  );
  const intl = useIntl();
  const selectedStudy = selectedStudyId ? studies[selectedStudyId] ?? null : null;

  useEffect(() => {
    dispatch(fetchStudiesData());
  }, [dispatch]);

  useEffect(() => {
    if (isMobile) return;
    if (!selectedStudyId && Object.keys(studies).length > 0) {
      dispatch(selectStudy(Object.keys(studies)[0]));
    }
  }, [dispatch, isMobile, studies, selectedStudyId]);

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (drawerOpen && selectedStudyId && !studies[selectedStudyId]) {
      setDrawerOpen(false);
    }
  }, [drawerOpen, selectedStudyId, studies]);

  const handleSelectStudy = (id: string) => {
    dispatch(selectStudy(id));
    if (isMobile) {
      setDrawerOpen(true);
    }
  };

  const handleSaveEdit = async (values: StudyEditValues) => {
    if (!selectedStudy) return;
    await dispatch(
      updateStudyFields({
        id: selectedStudy.id,
        ...values,
      })
    ).unwrap();
    setEditOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      intl.formatMessage({ id: "confirm_delete_study" }, { id })
    );
    if (!ok) return;
    await dispatch(removeStudy(id)).unwrap();
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const detailCard = (
    <StudyDetailCard
      selectedStudyId={selectedStudyId}
      onEdit={() => setEditOpen(true)}
      onDelete={() => selectedStudyId && handleDelete(selectedStudyId)}
      hideTitle={isMobile}
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        gap: 1,
      }}
    >
      <Box
        sx={{
          flex: "0 0 auto",
          maxHeight: "15%",
          minHeight: 0,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{ minHeight: 0 }}
        >
          <Typography variant="h6" noWrap sx={{ color: "var(--color-navy)" }}>
            {intl.formatMessage({ id: "studies_worklist" })}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate("/upload")}
            sx={{ flexShrink: 0 }}
          >
            {intl.formatMessage({ id: "create_study" })}
          </Button>
        </Stack>

        <SearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          label={intl.formatMessage({ id: "search_studies" })}
          placeholder={intl.formatMessage({ id: "search_studies_placeholder" })}
          showLabel={false}
          maxWidth={{ xs: "100%", sm: "50%" }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          flex: "1 1 85%",
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Paper
          sx={{
            flex: { xs: "1 1 auto", md: "2 1 0" },
            minWidth: 0,
            minHeight: 0,
            p: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <StudiesTable
            searchTerm={searchTerm}
            onSelectStudy={handleSelectStudy}
            onEditStudy={(id) => {
              dispatch(selectStudy(id));
              setEditOpen(true);
            }}
            onDeleteStudy={handleDelete}
          />
        </Paper>

        {!isMobile && (
          <Paper
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              minHeight: 0,
              p: 2,
              overflow: "auto",
            }}
          >
            {detailCard}
          </Paper>
        )}
      </Box>

      <Drawer
        anchor="bottom"
        open={isMobile && drawerOpen && Boolean(selectedStudyId)}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: "85vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            px: 2,
            pt: 1,
            pb: 2,
            overflow: "auto",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: "action.disabled",
              mb: 1,
            }}
          />
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle1" sx={{ color: "var(--color-navy)" }}>
              {intl.formatMessage({ id: "study_information" })}
            </Typography>
            <Tooltip title={intl.formatMessage({ id: "close" })}>
              <IconButton
                size="small"
                onClick={() => setDrawerOpen(false)}
                aria-label={intl.formatMessage({ id: "close" })}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {detailCard}
      </Drawer>

      <StudyEditDialog
        open={editOpen}
        study={selectedStudy}
        saving={mutating}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveEdit}
      />
    </Box>
  );
};

export default StudiesWorklist;
