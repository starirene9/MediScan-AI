import { useEffect, useState } from "react";
import { Box, Paper } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { AppDispatch, RootState } from "../../store/store";
import { fetchStudiesData, selectStudy } from "../../features/studies/studies-slice";
import SearchFilter from "../../components/shared/SearchFilter";
import StudiesTable from "./StudiesTable";
import StudyDetailCard from "./StudyDetailCard";

const StudiesWorklist = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const { studies, selectedStudyId } = useSelector(
    (state: RootState) => state.studies
  );
  const intl = useIntl();

  useEffect(() => {
    dispatch(fetchStudiesData());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedStudyId && Object.keys(studies).length > 0) {
      dispatch(selectStudy(Object.keys(studies)[0]));
    }
  }, [dispatch, studies, selectedStudyId]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 2 }}
    >
      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        label={intl.formatMessage({ id: "search_studies" })}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Paper
          sx={{
            flex: { xs: "1", md: "2" },
            p: 2,
            overflow: "auto",
            minHeight: 400,
          }}
        >
          <StudiesTable
            searchTerm={searchTerm}
            onSelectStudy={(id) => dispatch(selectStudy(id))}
          />
        </Paper>

        <Paper
          sx={{
            flex: { xs: "1", md: "1" },
            p: 2,
            overflow: "auto",
            minHeight: 300,
          }}
        >
          <StudyDetailCard selectedStudyId={selectedStudyId} />
        </Paper>
      </Box>
    </Box>
  );
};

export default StudiesWorklist;
