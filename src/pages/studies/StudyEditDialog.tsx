import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useIntl } from "react-intl";
import { Study } from "../../types/study";
import { studyStatusOptions } from "../../utils";

export type StudyEditValues = {
  patientName: string;
  age: number;
  gender: string;
  modality: string;
  status: Study["status"];
  notes: string;
};

interface StudyEditDialogProps {
  open: boolean;
  study: Study | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: StudyEditValues) => void;
}

const GENDERS = ["Female", "Male", "Unknown"] as const;

const StudyEditDialog = ({
  open,
  study,
  saving = false,
  onClose,
  onSave,
}: StudyEditDialogProps) => {
  const intl = useIntl();
  const [values, setValues] = useState<StudyEditValues>({
    patientName: "",
    age: 0,
    gender: "Unknown",
    modality: "Chest X-ray",
    status: "Pending",
    notes: "",
  });

  useEffect(() => {
    if (!study) return;
    setValues({
      patientName: study.patientName,
      age: study.age,
      gender: study.gender || "Unknown",
      modality: study.modality || "Chest X-ray",
      status: study.status,
      notes: study.notes || "",
    });
  }, [study, open]);

  const canSave = values.patientName.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {intl.formatMessage({ id: "edit_study" })}
        {study ? ` · ${study.id}` : ""}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            required
            label={intl.formatMessage({ id: "patient_name" })}
            value={values.patientName}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, patientName: e.target.value }))
            }
            fullWidth
            size="small"
          />
          <TextField
            label={intl.formatMessage({ id: "age" })}
            type="number"
            value={values.age}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                age: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            fullWidth
            size="small"
            inputProps={{ min: 0 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>{intl.formatMessage({ id: "gender" })}</InputLabel>
            <Select
              label={intl.formatMessage({ id: "gender" })}
              value={values.gender}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, gender: e.target.value }))
              }
            >
              {GENDERS.map((g) => (
                <MenuItem key={g} value={g}>
                  {intl.formatMessage({ id: `gender_${g.toLowerCase()}` })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={intl.formatMessage({ id: "modality" })}
            value={values.modality}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, modality: e.target.value }))
            }
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>{intl.formatMessage({ id: "status" })}</InputLabel>
            <Select
              label={intl.formatMessage({ id: "status" })}
              value={values.status}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  status: e.target.value as Study["status"],
                }))
              }
            >
              {studyStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {intl.formatMessage({
                    id: `study_status_${status.toLowerCase()}`,
                  })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={intl.formatMessage({ id: "radiologist_notes" })}
            value={values.notes}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, notes: e.target.value }))
            }
            fullWidth
            multiline
            minRows={3}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {intl.formatMessage({ id: "cancel" })}
        </Button>
        <Button
          variant="contained"
          disabled={!canSave || saving}
          onClick={() =>
            onSave({
              ...values,
              patientName: values.patientName.trim(),
            })
          }
        >
          {intl.formatMessage({ id: "save_changes" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudyEditDialog;
