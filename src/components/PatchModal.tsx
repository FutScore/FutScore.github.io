import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import DragDropZone from './DragDropZone';
import axios from 'axios';
import { API_BASE_URL } from '../api';

interface Patch {
  id: number;
  name: string;
  image: string;
  price?: number;
  active: boolean;
}

interface PatchModalProps {
  open: boolean;
  onClose: () => void;
  onAddPatches: (patches: string[]) => void;
  existingPatches: string[];
}

const PatchModal: React.FC<PatchModalProps> = ({
  open,
  onClose,
  onAddPatches,
  existingPatches,
}) => {
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [customImageError, setCustomImageError] = useState<string | null>(null);
  const [predefinedPatches, setPredefinedPatches] = useState<Patch[]>([]);
  const [patchesLoading, setPatchesLoading] = useState(false);
  const [patchesError, setPatchesError] = useState<string | null>(null);

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

    if (open) {
      fetchPatches();
    }
  }, [open]);

  const handlePatchToggle = (patchImage: string) => {
    setSelectedPatches(prev => 
      prev.includes(patchImage)
        ? prev.filter(img => img !== patchImage)
        : [...prev, patchImage]
    );
  };

  const handleCustomImageAdd = (file: File) => {
    setCustomImageError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setCustomImages(prev => [...prev, result]);
      } else {
        setCustomImageError('Erro ao processar a imagem');
      }
    };
    reader.onerror = () => setCustomImageError('Erro ao ler o ficheiro');
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomImage = (index: number) => {
    setCustomImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPatches = () => {
    const allPatches = [...selectedPatches, ...customImages];
    onAddPatches(allPatches);
    onClose();
    // Reset state
    setSelectedPatches([]);
    setCustomImages([]);
    setActiveTab(0);
    setCustomImageError(null);
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setSelectedPatches([]);
    setCustomImages([]);
    setActiveTab(0);
    setCustomImageError(null);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Adicionar Patches
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Patches
        </Typography>
        
        {patchesLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>A carregar patches...</Typography>
          </Box>
        )}
        
        {patchesError && (
          <Alert severity="error" sx={{ mb: 2 }}>{patchesError}</Alert>
        )}
        
        {!patchesLoading && !patchesError && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 120 }}>
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
              onClick={() => document.getElementById('patch-file-input')?.click()}
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
                onClick={() => handlePatchToggle(patch.image)}
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

            {/* Display custom uploaded patches */}
            {Array.isArray(customImages) && customImages.map((img, idx) => (
              <Box
                key={`custom-${idx}`}
                sx={{
                  width: 80,
                  height: 80,
                  border: '2px solid #4caf50',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={img}
                  alt={`custom patch ${idx + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    p: 0.5,
                  }}
                />
                <IconButton
                  size="small"
                  color="error"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    minWidth: 0,
                    p: 0.2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    },
                  }}
                  onClick={() => handleRemoveCustomImage(idx)}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    backgroundColor: '#4caf50',
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
              </Box>
            ))}
          </Box>
        )}

        {/* Hidden file input for custom patches */}
        <input
          id="patch-file-input"
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
          <Alert severity="error" sx={{ mt: 2 }}>{customImageError}</Alert>
        )}

        {predefinedPatches.length === 0 && !patchesLoading && !patchesError && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">Nenhum patch disponível</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          onClick={handleAddPatches} 
          variant="contained"
          disabled={selectedPatches.length === 0 && customImages.length === 0}
        >
          Adicionar Patches ({selectedPatches.length + customImages.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatchModal; 