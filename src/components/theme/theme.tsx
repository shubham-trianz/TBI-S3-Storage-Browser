import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

const baseTheme = createTheme({
  palette: {
    DataGrid: {
      bg: '#f8fafc',
      pinnedBg: '#f1f5f9',
      headerBg: '#eaeff5',
    },
  },
  spacing: 8,
});

const theme = responsiveFontSizes(baseTheme);

export default theme