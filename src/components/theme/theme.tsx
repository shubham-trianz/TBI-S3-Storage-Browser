import { createTheme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';


export const theme = createTheme({
  palette: {
    DataGrid: {
      // Container background
      bg: '#f8fafc',
      // Pinned rows and columns background
      pinnedBg: '#f1f5f9',
      // Column header background
      headerBg: '#eaeff5',
    },
  },
});