import { DefaultFontStyles, createTheme, IFontStyles, ITheme } from '@fluentui/react/lib/Styling';
import { IButtonStyles } from '@fluentui/react/lib/Button';
import { IDropdownStyles } from '@fluentui/react/lib/Dropdown';
import { PRIMARY_COLOR } from './config';

/** Fonts inherit from the page: every Fluent font slot keeps its size/weight but not its family. */
function inheritedFonts(): IFontStyles {
  const fonts = {} as { [slot: string]: unknown };
  const source = DefaultFontStyles as unknown as { [slot: string]: { fontFamily?: string } };
  Object.keys(source).forEach((slot) => {
    fonts[slot] = { ...source[slot], fontFamily: 'inherit' };
  });
  return fonts as unknown as IFontStyles;
}

/** Fluent theme scoped to the web part (it is never applied to the page). Primary = #3560D8. */
export const offencesTheme: ITheme = createTheme({
  rtl: true,
  palette: {
    themePrimary: PRIMARY_COLOR,
    themeLighterAlt: '#f6f8fe',
    themeLighter: '#dce5fa',
    themeLight: '#bccaf5',
    themeTertiary: '#7f9aec',
    themeSecondary: '#4a6fdd',
    themeDarkAlt: '#2f55c1',
    themeDark: '#2846a3',
    themeDarker: '#1d337a'
  },
  fonts: inheritedFonts()
});

export const primaryButtonStyles: IButtonStyles = {
  root: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, borderRadius: 4 },
  rootHovered: { backgroundColor: '#2f55c1', borderColor: '#2f55c1' },
  rootPressed: { backgroundColor: '#2846a3', borderColor: '#2846a3' },
  rootDisabled: { backgroundColor: '#f3f2f1', borderColor: '#f3f2f1' }
};

export const defaultButtonStyles: IButtonStyles = {
  root: { borderRadius: 4 }
};

export const dangerButtonStyles: IButtonStyles = {
  root: { backgroundColor: '#c50f1f', borderColor: '#c50f1f', borderRadius: 4, color: '#fff' },
  rootHovered: { backgroundColor: '#a80d1a', borderColor: '#a80d1a', color: '#fff' },
  rootPressed: { backgroundColor: '#8f0b17', borderColor: '#8f0b17', color: '#fff' },
  rootDisabled: { backgroundColor: '#f3f2f1', borderColor: '#f3f2f1' }
};

/** Icon-only buttons of the toolbar and of the table rows. */
export const iconButtonStyles: IButtonStyles = {
  root: { color: '#242424', width: 36, height: 36, borderRadius: 4 },
  rootHovered: { color: PRIMARY_COLOR, backgroundColor: '#f0f3fc' },
  rootPressed: { color: '#2846a3', backgroundColor: '#dce5fa' },
  rootChecked: { color: PRIMARY_COLOR, backgroundColor: '#e6ecfb' },
  rootCheckedHovered: { color: PRIMARY_COLOR, backgroundColor: '#dce5fa' },
  icon: { fontSize: 18 }
};

/** Law dropdowns: rounded hover rows inside a rounded list (as in 02_law_dropdown_reference.png). */
export const lawDropdownStyles: Partial<IDropdownStyles> = {
  callout: { borderRadius: 8 },
  dropdownItemsWrapper: { padding: 4 },
  dropdownItem: { minHeight: 40, borderRadius: 4 },
  dropdownItemSelected: { minHeight: 40, borderRadius: 4 }
};
