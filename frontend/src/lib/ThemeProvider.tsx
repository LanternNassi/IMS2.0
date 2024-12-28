'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { ReactNode, useMemo} from 'react';
import Theme from '../MUIStyles/Theme';
// import { createTheme } from '@mui/material/styles';


interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme();


  // useEffect(() => {
  //   const currentTheme = createTheme(Theme(theme));
  //   console.log('Current MUI Theme:', currentTheme);
  // }, [theme]);
  // Dynamically generate the MUI theme based on the current theme
  const muiTheme = useMemo(() => Theme(theme), [theme]);

  console.log(muiTheme.palette.mode)

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <MUIThemeProvider theme={muiTheme}>
        {children}
      </MUIThemeProvider>
    </NextThemesProvider>
  );
}
