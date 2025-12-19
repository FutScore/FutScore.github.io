import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Check as CheckIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../api';

interface Patch {
  id: number;
  name: string;
  image: string;
  price?: number;
  units?: number;
  active: boolean;
}

interface PatchSelectionProps {
  onPatchesChange: (patches: string[]) => void;
  selectedPatches: string[];
  title?: string;
}

const PatchSelection: React.FC<PatchSelectionProps> = ({
  onPatchesChange,
  selectedPatches,
  title = "Patches",
}) => {
  const [predefinedPatches, setPredefinedPatches] = useState<Patch[]>([]);
  const [patchesLoading, setPatchesLoading] = useState(false);
  const [patchesError, setPatchesError] = useState<string | null>(null);
  const [customImageError, setCustomImageError] = useState<string | null>(null);

  // Fetch patches from backend
  useEffect(() => {
    const fetchPatches = async () => {
      setPatchesLoading(true);
      setPatchesError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/.netlify/functions/getPatches`);
        // Handle both old format (array) and new format (paginated response)
        if (Array.isArray(response.data)) {
          setPredefinedPatches(response.data);
        } else {
          setPredefinedPatches(response.data.patches);
        }
      } catch (err: any) {
        setPatchesError('Erro ao carregar patches');
        console.error('Error fetching patches:', err);
      } finally {
        setPatchesLoading(false);
      }
    };

    fetchPatches();
  }, []);

  const handlePatchToggle = (patch: Patch) => {
    const patchImage = patch.image;
    const units = Math.max(1, Math.floor(patch.units || 1));
    const alreadySelected = selectedPatches.includes(patchImage);
    let newSelectedPatches: string[] = [];
    if (alreadySelected) {
      // remove all occurrences of this image
      newSelectedPatches = selectedPatches.filter(img => img !== patchImage);
    } else {
      // add as many entries as units
      newSelectedPatches = [...selectedPatches, ...Array(units).fill(patchImage)];
    }
    onPatchesChange(newSelectedPatches);
  };

  const handleCustomImageAdd = (file: File) => {
    setCustomImageError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const newSelectedPatches = [...selectedPatches, result];
        onPatchesChange(newSelectedPatches);
      } else {
        setCustomImageError('Erro ao processar a imagem');
      }
    };
    reader.onerror = () => setCustomImageError('Erro ao ler o ficheiro');
    reader.readAsDataURL(file);
  };

  const handleRemovePatch = (patchToRemove: string) => {
    const newSelectedPatches = selectedPatches.filter(patch => patch !== patchToRemove);
    onPatchesChange(newSelectedPatches);
  };

  const isCustomPatch = (patch: string) => {
    return patch.startsWith('data:');
  };

  const isPredefinedPatch = (patch: string) => {
    return predefinedPatches.some(p => p.image === patch);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {title}
      </Typography>
      
      {patchesLoading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">A carregar patches...</Typography>
        </Box>
      )}
      
      {patchesError && (
        <Alert severity="error" sx={{ mb: 2 }}>{patchesError}</Alert>
      )}
      
      {!patchesLoading && !patchesError && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {/* Custom Upload Option - First item */}
          <Box
            sx={{
              width: 80,
              height: 80,
              border: '2px dashed #ccc',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: '#fafafa',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: '#f0f8ff',
              },
            }}
            onClick={() => document.getElementById('patch-file-input-direct')?.click()}
          >
            <FileUploadIcon sx={{ fontSize: 24, color: '#666', mb: 0.5 }} />
            <Typography variant="caption" sx={{ color: '#666', textAlign: 'center', fontSize: '10px' }}>
              Próprio
            </Typography>
          </Box>

          {/* Predefined patches from admins */}
          {Array.isArray(predefinedPatches) && predefinedPatches.map((patch) => (
            <Box
              key={patch.id}
              sx={{
                width: 80,
                height: 80,
                border: selectedPatches.includes(patch.image) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  borderColor: '#1976d2',
                },
              }}
              onClick={() => handlePatchToggle(patch)}
            >
              <Box
                component="img"
                src={patch.image}
                alt={patch.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  p: 0.5,
                }}
              />
              {selectedPatches.includes(patch.image) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: '#1976d2',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon sx={{ color: 'white', fontSize: 12 }} />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Display selected patches (grouped by image with quantity badge) */}
      {selectedPatches.length > 0 && (() => {
        const grouped: Record<string, number> = selectedPatches.reduce((acc: Record<string, number>, img: string) => {
          acc[img] = (acc[img] || 0) + 1;
          return acc;
        }, {});
        const entries = Object.entries(grouped);
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Patches Selecionados ({selectedPatches.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {entries.map(([patch, count], idx) => (
                <Box
                  key={`${patch}-${idx}`}
                  sx={{
                    width: 60,
                    height: 60,
                    border: isCustomPatch(patch) ? '2px solid #4caf50' : '2px solid #1976d2',
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={patch}
                    alt={`selected patch ${idx + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      p: 0.5,
                    }}
                  />
                  {count > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        borderRadius: 1,
                        px: 0.5,
                        fontSize: 10,
                        lineHeight: '14px',
                      }}
                    >
                      x{count}
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      minWidth: 0,
                      p: 0.2,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)',
                      },
                    }}
                    onClick={() => handleRemovePatch(patch)}
                  >
                    <DeleteIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })()}

      {/* Hidden file input for custom patches */}
      <input
        id="patch-file-input-direct"
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            Array.from(files).forEach(file => handleCustomImageAdd(file));
            // Reset input value to allow re-selecting the same file
            e.target.value = '';
          }
        }}
      />

      {customImageError && (
        <Alert severity="error" sx={{ mt: 1 }}>{customImageError}</Alert>
      )}

      {predefinedPatches.length === 0 && !patchesLoading && !patchesError && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">Nenhum patch disponível</Typography>
        </Box>
      )}
    </Box>
  );
};

export default PatchSelection;
