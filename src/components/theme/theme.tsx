import { createTheme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

export const theme = createTheme({
  palette: {
    DataGrid: {
      bg: '#f8fafc',
      pinnedBg: '#f1f5f9',
      headerBg: '#eaeff5',
    },
  },
});