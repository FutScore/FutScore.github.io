import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface DragDropZoneProps {
  title: string;
  subtitle?: string;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  currentImage?: string;
  currentVideo?: string;
  accept?: string;
  multiple?: boolean;
  height?: number;
  fileType?: 'image' | 'video' | 'both';
}

const DragDropZone: React.FC<DragDropZoneProps> = ({
  title,
  subtitle = "Choose a file or drag it here",
  onFileSelect,
  onFileRemove,
  currentImage,
  currentVideo,
  accept = "image/*",
  multiple = false,
  height = 200,
  fileType = 'image',
}) => {
  const theme = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const isValidFileType = (file: File): boolean => {
    if (fileType === 'image') return file.type.startsWith('image/');
    if (fileType === 'video') return file.type.startsWith('video/');
    if (fileType === 'both') return file.type.startsWith('image/') || file.type.startsWith('video/');
    return false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multiple) {
        // For multiple files, pass all valid files
        const validFiles = files.filter(isValidFileType);
        if (validFiles.length > 0) {
          onFileSelect(validFiles[0]); // For now, just pass the first file
        }
      } else {
        const file = files[0];
        if (isValidFileType(file)) {
          onFileSelect(file);
        }
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        // For multiple files, pass all valid files
        const validFiles = Array.from(files).filter(isValidFileType);
        if (validFiles.length > 0) {
          onFileSelect(validFiles[0]); // For now, just pass the first file
        }
      } else {
        const file = files[0];
        if (isValidFileType(file)) {
          onFileSelect(file);
        }
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileRemove?.();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper
        elevation={isDragOver ? 8 : 1}
        sx={{
          height,
          border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.grey[300]}`,
          borderRadius: 2,
          backgroundColor: isDragOver ? theme.palette.primary.light + '20' : theme.palette.grey[50],
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light + '10',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {(currentImage || currentVideo) ? (
          <>
            {currentImage && (
              <Box
                component="img"
                src={currentImage}
                alt="preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            )}
            {currentVideo && (
              <Box
                component="video"
                src={currentVideo}
                controls
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            )}
            {onFileRemove && (
              <IconButton
                onClick={handleRemove}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}
          </>
        ) : (
          <>
            <UploadIcon
              sx={{
                fontSize: 48,
                color: theme.palette.primary.main,
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: 'center',
                px: 2,
              }}
            >
              {subtitle}
            </Typography>
          </>
        )}
      </Paper>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default DragDropZone; 