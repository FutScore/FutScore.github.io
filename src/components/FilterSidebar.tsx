import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// Use rsuite Tree (open-source & styled)
import { Tree } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface FilterSidebarProps {
  productTypes: any[];
  selectedType: string;
  onSelectType: (typeId: string) => void;
  onClearAll?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  productTypes,
  selectedType,
  onSelectType,
  onClearAll,
}) => {
  const treeData = useMemo(() => {
    const mapNode = (n: any): any => {
      const hasChildren = Array.isArray(n.children) && n.children.length > 0;
      const node: any = {
        value: String(n.id),
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{n.name}</span>
          </Box>
        ),
      };
      if (hasChildren) {
        node.children = n.children.map((c: any) => mapNode(c));
      } else {
        node.isLeaf = true; // ensure rsuite does not show expand arrow
      }
      return node;
    };
    return (Array.isArray(productTypes) ? productTypes : [])
      .filter((pt) => !pt.parent_id)
      .map((root) => mapNode(root));
  }, [productTypes]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        position: { md: 'sticky' },
        top: { md: 24 },
        maxHeight: { md: 'calc(100vh - 48px)' },
        overflow: { md: 'auto' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">Filtros</Typography>
        {onClearAll && (
          <Button size="small" onClick={onClearAll} color="secondary">
            Limpar
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Product Types - rc-tree (open-source, free) */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          p: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Tipos de Produto
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Button
            size="small"
            variant={selectedType === '' ? 'contained' : 'outlined'}
            onClick={() => onSelectType('')}
          >
            Todos
          </Button>
        </Box>
        <Tree
          data={treeData}
          defaultExpandAll
          style={{ background: 'transparent' }}
          value={selectedType || undefined}
          onSelect={(node: any) => onSelectType(node?.value ?? '')}
        />
      </Box>
    </Paper>
  );
};

export default FilterSidebar;
