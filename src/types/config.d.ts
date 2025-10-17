// types/config.d.ts
export interface Config {
  units: 'mm';
  scale: number;
  defaults: {
    fit: 'cover' | 'contain';
    safe_mm: number;
    bleed_mm: number;
    paper_thickness_mm: number;
  };
  part: {
    type: 'circle_duplex';
    outer_diameter_mm: number;
    images: {
      front: {
        src: string;
        fit?: 'cover' | 'contain';
      };
      back: {
        src: string;
        fit?: 'cover' | 'contain';
        flipXOnBack?: boolean;
      };
    };
    perforation: {
      shape: 'cross';
      half_arm_mm: number;
      arm_width_mm: number;
      dash_mm: number;
      gap_mm: number;
    };
    safe_mm?: number;
    bleed_mm?: number;
  };
  print: {
    page: {
      w_mm: number;
      h_mm: number;
      margin_mm: number;
    };
    grid: {
      cols: number;
      rows: number;
      spacing_mm: number;
    };
    registration_marks: boolean;
    show_cut_lines: boolean;
    show_safe_bleed: boolean;
  };
}